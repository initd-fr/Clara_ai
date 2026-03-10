import json
import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Environment
    ENV: str = "development"
    DEBUG: bool = True

    # API
    API_KEY: str
    API_URL: str

    # LLM API Keys
    OPENAI_API_KEY: str
    MISTRAL_API_KEY: str
    ANTHROPIC_API_KEY: str
    GEMINI_API_KEY: str

    # Embedding
    EMBEDDINGS_MODEL: str = "text-embedding-3-small"

    # Search API Keys
    GOOGLE_API_KEY: str
    GOOGLE_CSE_ID: str
    SERPER_API_KEY: str
    TAVILY_API_KEY: str

    # PostgreSQL
    DATABASE_URL: str
    # Schéma par défaut (search_path). Ne pas mettre dans l’URL (non supporté par psycopg2).
    DATABASE_SCHEMA: str = "public"
    # Taille du pool SQLAlchemy. Sans pgbouncer, garder modéré (ex. 10) pour ne pas surcharger la DB.
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_USESSL: bool = False

    # CORS
    CORS_ORIGINS: str = "[]"

    # Performance
    MAX_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 30
    RETRY_ATTEMPTS: int = 3
    RETRY_DELAY: int = 20

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Cache
    CACHE_TTL: int = 300  # 5 minutes
    CACHE_MAX_SIZE: int = 1000

    # Rate limiting (géré en amont par reverse proxy / API maître ; valeurs pour doc ou usage futur)
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return []

    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENV.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENV.lower() == "development"

    def validate_api_keys(self) -> bool:
        """Validate that all required API keys are present"""
        required_keys = [
            "OPENAI_API_KEY",
            "MISTRAL_API_KEY",
            "ANTHROPIC_API_KEY",
            "GEMINI_API_KEY",
            "DATABASE_URL",
        ]

        missing_keys = []
        for key in required_keys:
            if not getattr(self, key, None):
                missing_keys.append(key)

        if missing_keys:
            raise ValueError(f"Missing required API keys: {missing_keys}")

        return True

    class Config:
        # Charger le .env à la racine du dépôt (archibald/app/core -> ../../.. = racine)
        _root_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        )
        env_file = os.path.join(_root_dir, ".env")
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    settings = Settings()
    settings.validate_api_keys()
    return settings


settings = get_settings()
