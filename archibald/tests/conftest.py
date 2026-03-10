"""Configuration pytest : env de test et client HTTP."""
import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

# Définir les variables d'environnement avant tout import de app
os.environ.setdefault("ENV", "development")
os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("API_URL", "http://test")
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/test")
os.environ.setdefault("OPENAI_API_KEY", "sk-test")
os.environ.setdefault("MISTRAL_API_KEY", "test")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test")
os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("CORS_ORIGINS", "[]")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin")
os.environ.setdefault("MINIO_USESSL", "0")
os.environ.setdefault("GOOGLE_API_KEY", "")
os.environ.setdefault("GOOGLE_CSE_ID", "")
os.environ.setdefault("SERPER_API_KEY", "")
os.environ.setdefault("TAVILY_API_KEY", "")


@pytest.fixture(scope="session")
def app():
    """Application FastAPI avec DB mockée pour éviter une vraie connexion."""
    with (
        patch("app.main.init_db"),
        patch("app.main.test_db_connection", return_value=True),
    ):
        from app.main import app as fastapi_app
        yield fastapi_app


@pytest.fixture
def client(app):
    """Client de test HTTP."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Headers avec clé API valide pour les tests."""
    return {"X-API-Key": os.environ.get("API_KEY", "test-api-key")}
