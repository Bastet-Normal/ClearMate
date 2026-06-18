"""File repository."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File


class FileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, file: File) -> File:
        self.db.add(file)
        await self.db.commit()
        await self.db.refresh(file)
        return file

    async def get_by_id(self, file_id: int, user_id: int) -> File | None:
        result = await self.db.execute(
            select(File).where(File.id == file_id, File.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: int, offset: int = 0, limit: int = 20
    ) -> list[File]:
        result = await self.db.execute(
            select(File)
            .where(File.user_id == user_id)
            .order_by(File.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, file: File, data: dict) -> File:
        for key, value in data.items():
            setattr(file, key, value)
        await self.db.commit()
        await self.db.refresh(file)
        return file

    async def delete(self, file: File) -> None:
        await self.db.delete(file)
        await self.db.commit()
