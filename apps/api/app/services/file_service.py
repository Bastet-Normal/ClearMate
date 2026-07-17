"""File service - 上传、文本提取、删除。"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from pathlib import Path

from app.core.config import settings
from app.models.file import File
from app.repositories.file import FileRepository
from app.services.file_text_extractor import extract_text

logger = logging.getLogger(__name__)


def _safe_original_name(name: str) -> str:
    basename = re.split(r"[\\/]", name)[-1]
    basename = "".join(char for char in basename if char.isprintable()).strip(" .")
    return (basename or "unnamed")[:255]


class FileService:
    def __init__(self, db):
        self.db = db
        self.repo = FileRepository(db)

    def _ensure_storage_dir(self) -> Path:
        """确保上传目录存在。"""
        storage_path = Path(settings.LOCAL_STORAGE_PATH).resolve()
        storage_path.mkdir(parents=True, exist_ok=True)
        return storage_path

    async def upload(
        self,
        user_id: int,
        original_name: str,
        mime_type: str,
        content: bytes,
    ) -> File:
        """保存上传文件并提取文本。"""
        storage_dir = self._ensure_storage_dir()

        original_name = _safe_original_name(original_name)

        # 生成唯一文件名，保留原扩展名
        ext = Path(original_name).suffix.lower()
        unique_name = f"{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = storage_dir / unique_name

        # 写入磁盘
        await asyncio.to_thread(file_path.write_bytes, content)

        # 创建数据库记录
        file_record = File(
            user_id=user_id,
            original_name=original_name,
            mime_type=mime_type,
            size_bytes=len(content),
            storage_path=str(file_path),
            extracted_text=None,
            extraction_status="pending",
        )
        try:
            file_record = await self.repo.create(file_record)
        except Exception:
            file_path.unlink(missing_ok=True)
            raise

        # 提取文本（同步，因为文件不大）
        try:
            text = await extract_text(file_path, mime_type)
            await self.repo.update(
                file_record,
                {
                    "extracted_text": text,
                    "extraction_status": "done",
                },
            )
        except Exception as e:
            logger.warning("Text extraction failed for upload %s: %s", file_record.id, e)
            await self.repo.update(
                file_record,
                {
                    "extracted_text": "[文本提取失败，请检查文件是否完整或改用文本输入]",
                    "extraction_status": "failed",
                },
            )

        return file_record

    async def get(self, file_id: int, user_id: int) -> File | None:
        return await self.repo.get_by_id(file_id, user_id)

    async def list_files(self, user_id: int, offset: int = 0, limit: int = 20):
        return await self.repo.list_by_user(user_id, offset, limit)

    async def delete(self, file_id: int, user_id: int) -> bool:
        file_record = await self.repo.get_by_id(file_id, user_id)
        if not file_record:
            return False

        await self.repo.delete(file_record)

        # 数据库删除成功后清理物理文件；失败时记录孤儿文件供运维清理。
        try:
            if os.path.exists(file_record.storage_path):
                os.remove(file_record.storage_path)
        except OSError as exc:
            logger.warning("Failed to remove stored file %s: %s", file_record.id, exc)
        return True
