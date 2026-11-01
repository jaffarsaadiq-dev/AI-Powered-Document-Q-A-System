from pathlib import Path
import pymupdf as fitz
from config import CHUNK_WORDS, CHUNK_OVERLAP_WORDS

def extract_pages(file_path: Path, extension: str):
    """Return a list of {page, text}. TXT files use page=None."""
    if extension.lower() == ".pdf":
        pages = []
        with fitz.open(file_path) as pdf:
            for index, page in enumerate(pdf, start=1):
                text = page.get_text("text").strip()
                if text:
                    pages.append({"page": index, "text": text})
        return pages

    text = file_path.read_text(encoding="utf-8", errors="replace").strip()
    return [{"page": None, "text": text}] if text else []

def split_into_chunks(text: str, chunk_words=CHUNK_WORDS, overlap=CHUNK_OVERLAP_WORDS):
    words = text.split()
    if not words:
        return []
    chunk_words = max(1, chunk_words)
    overlap = max(0, min(overlap, chunk_words - 1))
    step = chunk_words - overlap
    chunks = []
    for start in range(0, len(words), step):
        chunk = " ".join(words[start:start + chunk_words]).strip()
        if chunk:
            chunks.append(chunk)
        if start + chunk_words >= len(words):
            break
    return chunks

def pages_to_chunks(pages):
    result = []
    for item in pages:
        for chunk in split_into_chunks(item["text"]):
            result.append({"page": item["page"], "text": chunk})
    return result
