from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from config import MAX_FILE_SIZE_MB, UPLOAD_DIR
from database import (
    add_document, delete_document_row, get_document, init_db, list_documents,
)
from schemas import AskRequest, AskResponse
from services.document_processor import extract_pages, pages_to_chunks
from services.rag import add_chunks, generate_answer, remove_chunks, retrieve

MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="AI Document Q&A API",
    description="Upload documents and ask questions using RAG and a local Ollama model.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI Document Q&A API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/documents")
def get_documents():
    return {"documents": list_documents()}

@app.post("/api/documents", status_code=201)
async def upload_document(file: UploadFile = File(...)):
    original_name = Path(file.filename or "document").name
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    contents = await file.read(MAX_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    document_id = str(uuid.uuid4())
    stored_name = f"{document_id}{extension}"
    destination = UPLOAD_DIR / stored_name
    destination.write_bytes(contents)

    try:
        pages = extract_pages(destination, extension)
        chunks = pages_to_chunks(pages)
        if not chunks:
            raise HTTPException(
                status_code=422,
                detail="No text was extracted. This may be a scanned PDF; OCR is not included.",
            )
        chunk_count = add_chunks(document_id, original_name, chunks)
        uploaded_at = datetime.now(timezone.utc).isoformat()
        add_document(document_id, original_name, stored_name, uploaded_at, chunk_count)
        return {
            "id": document_id,
            "filename": original_name,
            "uploaded_at": uploaded_at,
            "chunk_count": chunk_count,
            "message": "Document uploaded and indexed successfully.",
        }
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    except Exception as exc:
        destination.unlink(missing_ok=True)
        try:
            remove_chunks(document_id)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Could not process document: {exc}") from exc

@app.post("/api/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be blank.")
    document = get_document(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        sources = retrieve(question, request.document_id)
        answer = generate_answer(question, sources)
        return {"answer": answer, "sources": sources}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Question answering failed: {exc}") from exc

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    document = get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        remove_chunks(document_id)
        (UPLOAD_DIR / document["stored_name"]).unlink(missing_ok=True)
        delete_document_row(document_id)
        return {"message": "Document deleted successfully.", "id": document_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete document: {exc}") from exc
