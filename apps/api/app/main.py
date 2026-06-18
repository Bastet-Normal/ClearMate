from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import async_engine, Base
from app.models import User, Task, Analysis, File  # noqa: F401 – ensure models registered on Base
from app.api.v1.auth import router as auth_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.analyses import router as analyses_router
from app.api.v1.files import router as files_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-create tables on startup (dev only – use Alembic in production)."""
    if settings.DATABASE_URL.startswith("sqlite"):
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ClearMate - AI Life Affairs Agent Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


# CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# V1 routes
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(analyses_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")


# Health check
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
