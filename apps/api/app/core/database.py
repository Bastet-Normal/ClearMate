from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# Detect if using SQLite
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Normalize driver URLs so the sync migration engine and async API engine each
# receive a compatible dialect.
_sync_url = settings.DATABASE_URL
_async_url = settings.DATABASE_URL
if _is_sqlite:
    _sync_url = _sync_url.replace("+aiosqlite", "")
elif _sync_url.startswith("postgresql+asyncpg://"):
    _sync_url = _sync_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
elif _sync_url.startswith("postgresql://"):
    _async_url = _async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _sync_url.startswith("postgresql+psycopg2://"):
    _async_url = _async_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
engine = create_engine(_sync_url, echo=settings.DEBUG, future=True)

# SQLite needs foreign key enforcement
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Async engine for FastAPI
async_engine = create_async_engine(_async_url, echo=settings.DEBUG)

if _is_sqlite:
    @event.listens_for(async_engine.sync_engine, "connect")
    def _set_async_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

SessionLocal = sessionmaker(engine)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
