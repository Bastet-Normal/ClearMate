"""File model - 用户上传的文件。"""
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Integer, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class File(Base):
    """用户上传的文件记录。

    文件物理存储在本地 ``uploads/`` 目录（或 MinIO，后续扩展）。
    数据库只存元信息和提取的文本。
    """

    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )

    # 文件元信息
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # 文本提取结果
    extracted_text: Mapped[str | None] = mapped_column(
        String(50000), nullable=True
    )  # 提取的文本，供 AI 分析用
    extraction_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending / done / failed

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="files")
