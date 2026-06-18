"""Task schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=5000)
    task_type: str = Field(max_length=50)
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, max_length=50)
    risk_level: str | None = Field(default=None, max_length=20)
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None


class TaskOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    task_type: str
    status: str
    risk_level: str | None
    deadline_at: datetime | None
    reminder_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
