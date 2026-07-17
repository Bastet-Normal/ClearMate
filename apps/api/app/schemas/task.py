"""Task schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TaskType = Literal[
    "scam_check",
    "refund_request",
    "complaint",
    "subscription_cancel",
    "document_review",
    "bill_check",
    "shopping_risk",
    "general_life_issue",
]
TaskStatus = Literal[
    "draft",
    "pending_info",
    "analyzing",
    "waiting_confirmation",
    "ready_to_execute",
    "in_progress",
    "waiting_response",
    "completed",
    "failed",
    "archived",
]
RiskLevel = Literal["low", "medium", "high", "critical"]


class TaskCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=50000)
    task_type: TaskType
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None


class TaskUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50000)
    status: TaskStatus | None = None
    risk_level: RiskLevel | None = None
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None


class TaskOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    task_type: TaskType
    status: TaskStatus
    risk_level: RiskLevel | None
    deadline_at: datetime | None
    reminder_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListOut(BaseModel):
    items: list[TaskOut]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
