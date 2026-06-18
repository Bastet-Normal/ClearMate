"""File routes - 上传、查询、删除文件。"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.file import FileOut
from app.services.file_service import FileService

router = APIRouter(prefix="/files", tags=["files"])


def _validate_mime(mime_type: str) -> None:
    """校验 MIME 类型是否在允许列表内。"""
    allowed = [m.strip() for m in settings.ALLOWED_MIME_TYPES.split(",")]
    if mime_type not in allowed:
        raise HTTPException(
            status_code=415,
            detail=f"不支持的文件类型: {mime_type}。允许: {', '.join(allowed)}",
        )


@router.post("", response_model=FileOut, status_code=201)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传单个文件。MVP 阶段同步提取文本。"""
    # 校验 MIME
    mime_type = file.content_type or "application/octet-stream"
    _validate_mime(mime_type)

    # 校验大小
    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"文件过大: {len(content)} bytes，上限 {max_bytes} bytes",
        )

    svc = FileService(db)
    file_record = await svc.upload(
        user_id=current_user.id,
        original_name=file.filename or "unnamed",
        mime_type=mime_type,
        content=content,
    )
    return FileOut.model_validate(file_record)


@router.get("", response_model=list[FileOut])
async def list_files(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """列出当前用户的文件。"""
    svc = FileService(db)
    files = await svc.list_files(current_user.id, offset, limit)
    return [FileOut.model_validate(f) for f in files]


@router.get("/{file_id}", response_model=FileOut)
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取文件详情（含提取的文本）。"""
    svc = FileService(db)
    file_record = await svc.get(file_id, current_user.id)
    if not file_record:
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileOut.model_validate(file_record)


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除文件（物理文件 + 数据库记录）。"""
    svc = FileService(db)
    ok = await svc.delete(file_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="文件不存在")
