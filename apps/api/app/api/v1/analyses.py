"""Analysis routes - 触发 AI 分析 & 查看分析结果。"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.analysis import Analysis
from app.models.task import Task
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.analysis import AnalysisOut
from app.services.analysis_service import AnalysisService
from app.services.llm import get_llm_client

router = APIRouter(prefix="/tasks/{task_id}/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisOut, status_code=201)
async def create_analysis(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """对指定任务执行一次 AI 分析。"""
    # 确认任务存在且属于当前用户
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    llm = get_llm_client()
    svc = AnalysisService(db, llm)
    analysis = await svc.analyze_task(task)
    return AnalysisOut.model_validate(analysis)


@router.get("", response_model=list[AnalysisOut])
async def list_analyses(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查看任务的所有分析记录。"""
    # 确认任务属于当前用户
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    result = await db.execute(
        select(Analysis)
        .where(Analysis.task_id == task_id)
        .order_by(Analysis.created_at.desc())
    )
    analyses = list(result.scalars().all())
    return [AnalysisOut.model_validate(a) for a in analyses]


@router.get("/latest", response_model=AnalysisOut)
async def get_latest_analysis(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取任务最新的分析结果。"""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    result = await db.execute(
        select(Analysis)
        .where(Analysis.task_id == task_id)
        .order_by(Analysis.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="该任务尚无分析结果")
    return AnalysisOut.model_validate(analysis)
