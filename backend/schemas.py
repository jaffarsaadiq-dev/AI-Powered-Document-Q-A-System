# pyrefly: ignore[missing-import]
from pydantic import BaseModel, Field

class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str

class Source(BaseModel):
    document_id: str
    filename: str
    page: int | None = None
    text: str
    distance: float | None = None

class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
