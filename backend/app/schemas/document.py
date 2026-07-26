import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    """
    Data Transfer Object representing a document resource response.
    """

    id: uuid.UUID
    filename: str
    file_path: str
    file_hash: str
    mime_type: str
    size_bytes: int
    status: str
    category: str
    full_text: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """
    Paginated lists of document resources.
    """

    items: list[DocumentResponse]
    total: int
