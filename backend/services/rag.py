import requests
import chromadb
from config import CHROMA_DIR, OLLAMA_BASE_URL, OLLAMA_MODEL, TOP_K
from services.embeddings import embed_texts

_client = None
_collection = None

def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _client.get_or_create_collection(
            name="document_chunks",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection

def add_chunks(document_id, filename, chunks):
    if not chunks:
        return 0
    collection = get_collection()
    texts = [item["text"] for item in chunks]
    embeddings = embed_texts(texts)
    ids = [f"{document_id}_{index}" for index in range(len(chunks))]
    metadatas = [
        {
            "document_id": document_id,
            "filename": filename,
            "page": item["page"] if item["page"] is not None else -1,
        }
        for item in chunks
    ]
    collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
    return len(chunks)

def remove_chunks(document_id):
    collection = get_collection()
    collection.delete(where={"document_id": document_id})

def retrieve(question, document_id):
    collection = get_collection()
    if collection.count() == 0:
        return []
    query_embedding = embed_texts([question])[0]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K,
        where={"document_id": document_id},
        include=["documents", "metadatas", "distances"],
    )
    sources = []
    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    distances = results.get("distances") or [[]]
    for text, metadata, distance in zip(documents[0], metadatas[0], distances[0]):
        sources.append({
            "document_id": metadata["document_id"],
            "filename": metadata["filename"],
            "page": metadata.get("page", -1) if metadata.get("page", -1) >= 1 else None,
            "text": text,
            "distance": float(distance) if distance is not None else None,
        })
    return sources

def generate_answer(question, sources):
    if not sources:
        return "I couldn't find relevant text in this document. Try asking a more specific question or upload a text-based PDF."

    context = "\n\n".join(
        f"[Source {i + 1} | {source['filename']}"
        + (f" | page {source['page']}" if source["page"] else "")
        + f"]\n{source['text']}"
        for i, source in enumerate(sources)
    )
    prompt = (
        "You are a careful document question-answering assistant. Answer the user's "
        "question using only the CONTEXT below. If the context does not contain the "
        "answer, clearly say that the document does not provide enough information. "
        "Do not invent facts. Refer to source numbers when helpful.\n\n"
        f"CONTEXT:\n{context}\n\nQUESTION:\n{question}"
    )
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=180,
        )
        response.raise_for_status()
        answer = response.json().get("message", {}).get("content", "").strip()
        if not answer:
            raise RuntimeError("Ollama returned an empty response.")
        return answer
    except requests.exceptions.ConnectionError as exc:
        raise RuntimeError(
            "Cannot connect to Ollama. Start Ollama and confirm the model is installed."
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "The AI model timed out. Try a shorter question or check available RAM."
        ) from exc
    except requests.exceptions.HTTPError as exc:
        detail = exc.response.text[:300] if exc.response is not None else str(exc)
        raise RuntimeError(f"Ollama request failed: {detail}") from exc
