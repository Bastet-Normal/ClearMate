"""Analysis schemas."""
from datetime import datetime

from pydantic import BaseModel, Field


class AnalysisOut(BaseModel):
    id: int
    task_id: int
    provider: str
    model: str
    prompt_version: str
    risk_level: str
    result_json: dict
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}
