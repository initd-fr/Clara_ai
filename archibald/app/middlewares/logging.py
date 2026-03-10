import time

from fastapi import Request

from app.core.logging_config import get_logger

logger = get_logger("requests")


async def log_requests(request: Request, call_next):
    """Log chaque requête : méthode, chemin, statut, durée, et résultat (OK / REJECTED / ERROR)."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    status = response.status_code

    if status == 401:
        label = "REJECTED (clé API invalide ou absente)"
    elif status >= 500:
        label = "ERROR"
    elif status >= 400:
        label = "CLIENT_ERROR"
    else:
        label = "OK"

    logger.info(
        "%s %s | %d | %.0fms | %s",
        request.method,
        request.url.path,
        status,
        duration_ms,
        label,
    )
    return response
