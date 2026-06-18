from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "ClearMate"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database (default to SQLite for local dev; override with .env for PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./clearmate.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-strong-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File Storage
    STORAGE_TYPE: str = "local"  # local or minio
    LOCAL_STORAGE_PATH: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 20
    ALLOWED_MIME_TYPES: str = (
        "image/jpeg,image/png,image/gif,image/webp,"
        "application/pdf,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
        "text/plain"
    )

    # MinIO
    MINIO_ENDPOINT: Optional[str] = None
    MINIO_ACCESS_KEY: Optional[str] = None
    MINIO_SECRET_KEY: Optional[str] = None
    MINIO_BUCKET: str = "clearmate"
    MINIO_SECURE: bool = False

    # LLM
    LLM_PROVIDER: str = "mock"  # mock or openai
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
