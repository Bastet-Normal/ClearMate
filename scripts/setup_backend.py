"""Script to create all Phase 0 project files."""
import os

BASE = r"C:\Users\24377\Desktop\ClearMate"


def write(path: str, content: str):
    full_path = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Created {path}")


# ============================================================
# Backend files
# ============================================================

write("apps/api/app/core/security.py", '''"""Authentication and security utilities."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
''')

write("apps/api/alembic.ini", '''[alembic]
script_location = alembic
sqlalchemy.url = postgresql://clearmate:clearmate@localhost:5432/clearmate

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
''')

write("apps/api/alembic/env.py", '''"""Alembic environment configuration."""
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.core.config import settings
from app.core.database import Base

# Import all models so they are registered on Base.metadata
# from app.models import user, task, file, analysis, action_plan, reminder, audit_log, prompt_template, model_call_log

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
''')

write("apps/api/alembic/versions/.gitkeep", "")

# ============================================================
# Infrastructure files
# ============================================================

write("infra/docker/Dockerfile.api", '''FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY apps/api/pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy source
COPY apps/api/app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
''')

write("infra/docker/Dockerfile.web", '''FROM node:20-alpine

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm install

COPY apps/web ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
''')

write("infra/nginx/nginx.conf", '''upstream frontend {
    server web:3000;
}

upstream backend {
    server api:8000;
}

server {
    listen 80;
    server_name localhost;

    client_max_body_size 25M;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://backend;
    }
}
''')

write("infra/docker-compose.yml", '''version: "3.8"

services:
  # PostgreSQL
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: clearmate
      POSTGRES_PASSWORD: clearmate
      POSTGRES_DB: clearmate
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clearmate"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # FastAPI Backend
  api:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.api
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://clearmate:clearmate@db:5432/clearmate
      REDIS_URL: redis://redis:6379/0
      LLM_PROVIDER: mock
      CORS_ORIGINS: http://localhost:3000,http://localhost
    volumes:
      - ../../apps/api/app:/app/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Next.js Frontend
  web:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    volumes:
      - ../../apps/web:/app
      - /app/node_modules
    depends_on:
      - api

volumes:
  pgdata:
  redisdata:
''')

# ============================================================
# Root config files
# ============================================================

write(".env.example", '''# ClearMate Environment Variables
# Copy this file to .env and fill in your values

# App
APP_NAME=ClearMate
APP_VERSION=0.1.0
DEBUG=true

# Database
DATABASE_URL=postgresql://clearmate:clearmate@localhost:5432/clearmate

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=change-me-in-production-use-a-strong-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Storage
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
MAX_FILE_SIZE_MB=20

# MinIO (optional)
# MINIO_ENDPOINT=localhost:9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
# MINIO_BUCKET=clearmate

# LLM
LLM_PROVIDER=mock
# OPENAI_API_KEY=sk-xxx
# OPENAI_API_BASE=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini

# CORS
CORS_ORIGINS=http://localhost:3000
''')

write(".gitignore", '''# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/
env/

# Build
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/

# Database
*.db
*.sqlite

# Logs
*.log
logs/

# Docker
docker-compose.override.yml

# Alembic
alembic/versions/__pycache__/

# Testing
coverage/
.coverage
htmlcov/

# Misc
*.bak
*.tmp
''')

write("CHANGELOG.md", '''# Changelog

All notable changes to ClearMate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2025-06-18

### Added
- Project initialization with monorepo structure
- PRD, Architecture, and Implementation Plan documents
- FastAPI backend scaffold with `/health` endpoint
- Next.js frontend scaffold with home page (3 core entry buttons)
- Docker Compose configuration (PostgreSQL + Redis + API + Web)
- Environment variable template (.env.example)
- Basic project configuration and CORS setup
''')

print("\nAll backend and infrastructure files created!")
