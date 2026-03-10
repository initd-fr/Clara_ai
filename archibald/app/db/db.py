import re

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import settings

# Nettoie l’URL : retirer pgbouncer=true et schema (non reconnus par psycopg2/libpq)
# Le schéma se configure via DATABASE_SCHEMA + options search_path.
_clean_url = re.sub(r"([&?])pgbouncer=true&?", r"\1", settings.DATABASE_URL)
_clean_url = re.sub(r"([&?])schema=[^&]*&?", r"\1", _clean_url)
_clean_url = re.sub(r"[&?]$", "", _clean_url)

_connect_args = {
    "connect_timeout": 10,
    "application_name": "archibald_engine",
    "client_encoding": "utf8",
}
if getattr(settings, "DATABASE_SCHEMA", None):
    _connect_args["options"] = f"-c search_path={settings.DATABASE_SCHEMA}"

engine = create_engine(
    _clean_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_recycle=3600,
    pool_timeout=30,
    poolclass=QueuePool,
    connect_args=_connect_args,
)

# Configuration de la session
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Évite les requêtes supplémentaires
)

Base = declarative_base()


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        raise RuntimeError(f"Failed to initialize database: {e}") from e


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def test_db_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception:
        return False
