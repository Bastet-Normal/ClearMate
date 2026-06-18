"""Analysis model - 一次 AI 分析的完整记录。"""
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Analysis(Base):
    """单次 AI 分析的结果记录。

    一个 task 可以有多次 analysis（重试、补充信息后再分析），
    业务上以最新的 analysis 为准。
    """

    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # 调用元数据
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), default="v1", nullable=False)

    # 结构化结果
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    result_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    # 调用统计
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    task = relationship("Task", back_populates="analyses")
