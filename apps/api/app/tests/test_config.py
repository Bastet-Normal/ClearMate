"""Production configuration safety tests."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_rejects_default_or_short_secret():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY="short",
            DEBUG=False,
        )


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY="a-secure-production-secret-with-32-chars",
            CORS_ORIGINS="*",
            DEBUG=False,
        )


def test_production_accepts_explicit_secure_values():
    config = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SECRET_KEY="a-secure-production-secret-with-32-chars",
        CORS_ORIGINS="https://clearmate.example",
        DEBUG=False,
    )
    assert config.ENVIRONMENT == "production"
