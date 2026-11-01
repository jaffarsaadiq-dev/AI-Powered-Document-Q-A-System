from functools import lru_cache
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

@lru_cache(maxsize=1)
def get_model():
    # First run downloads the model; allow a few minutes on slower connections.
    return SentenceTransformer(EMBEDDING_MODEL)

def embed_texts(texts):
    if not texts:
        return []
    vectors = get_model().encode(
        texts, normalize_embeddings=True, show_progress_bar=False
    )
    return vectors.tolist()
