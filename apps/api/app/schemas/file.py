"""File schemas."""
from datetime import datetime

from pydantic import BaseModel


class FileOut(BaseModel):
    id: int
    user_id: int
    original_name: str
    mime_type: str
    size_bytes: int
    storage_path: str
    extracted_text: str | None
    extraction_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
