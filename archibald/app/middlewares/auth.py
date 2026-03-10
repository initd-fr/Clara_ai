import secrets

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings


async def verify_api_key(request: Request, call_next):
    public_endpoints = ["/docs", "/redoc", "/openapi.json", "/health"]

    if any(request.url.path.startswith(endpoint) for endpoint in public_endpoints):
        return await call_next(request)

    api_key = request.headers.get("X-API-Key") or ""
    if not api_key or not secrets.compare_digest(api_key, settings.API_KEY):
        return JSONResponse(status_code=401, content={"detail": "Invalid API Key"})
    return await call_next(request)
