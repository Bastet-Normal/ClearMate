"""Task service – business logic for task CRUD."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.repositories.task import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut


class TaskService:
    def __init__(self, db: AsyncSession):
        self.repo = TaskRepository(db)

    async def create_task(self, user_id: int, data: TaskCreate) -> TaskOut:
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            task_type=data.task_type,
            deadline_at=data.deadline_at,
            reminder_at=data.reminder_at,
        )
        task = await self.repo.create(task)
        return TaskOut.model_validate(task)

    async def get_task(self, task_id: int, user_id: int) -> TaskOut | None:
        task = await self.repo.get_by_id(task_id, user_id)
        if not task:
            return None
        return TaskOut.model_validate(task)

    async def list_tasks(
        self, user_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[list[TaskOut], int]:
        offset = (page - 1) * page_size
        items, total = await self.repo.list_by_user(user_id, offset, page_size)
        return [TaskOut.model_validate(t) for t in items], total

    async def update_task(
        self, task_id: int, user_id: int, data: TaskUpdate
    ) -> TaskOut | None:
        task = await self.repo.get_by_id(task_id, user_id)
        if not task:
            return None
        update_data = data.model_dump(exclude_unset=True)
        task = await self.repo.update(task, update_data)
        return TaskOut.model_validate(task)

    async def delete_task(self, task_id: int, user_id: int) -> bool:
        task = await self.repo.get_by_id(task_id, user_id)
        if not task:
            return False
        await self.repo.delete(task)
        return True
