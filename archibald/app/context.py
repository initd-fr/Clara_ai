##
# ~ IMPORTS
import os
from typing import Optional

from fastapi import Request
from minio import Minio

from .db import db

_global_minio: Optional[Minio] = None


def create_minio_config():
    return {
        "endpoint": os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        "access_key": os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        "secret_key": os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        "secure": os.getenv("MINIO_USESSL", "0") == "1",
        # Paramètres de performance
        "connect_timeout": 10000,  # 10 secondes
        "max_retries": 3,
        "part_size": 10 * 1024 * 1024,  # 10MB par partie pour les uploads
    }


def create_minio_client():
    config = create_minio_config()
    return Minio(
        endpoint=config["endpoint"],
        access_key=config["access_key"],
        secret_key=config["secret_key"],
        secure=config["secure"],
    )


minio = _global_minio if _global_minio else create_minio_client()

if os.getenv("ENV") != "production":
    _global_minio = minio


async def test_minio_connection() -> bool:
    try:
        await minio.list_buckets()
        return True
    except Exception:
        return False


async def reconnect_minio() -> bool:
    try:
        is_connected = await test_minio_connection()
        if not is_connected:
            global _global_minio
            _global_minio = create_minio_client()
            await test_minio_connection()
        return True
    except Exception:
        return False


class AppContext:
    def __init__(self):
        self.db = db
        self.minio = minio


async def get_context(request: Request) -> Optional[dict]:
    return AppContext()
