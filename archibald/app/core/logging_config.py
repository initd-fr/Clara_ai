import logging
import logging.config
from typing import Any, Dict


class ArchibaldEngineFormatter(logging.Formatter):
    """Format lisible pour les logs de contrôle au démarrage et des requêtes."""

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        return f"[ARCHIBALD ENGINE] {base}"


def setup_logging():
    """Configure le logging : console pour app (contrôle démarrage et requêtes)."""
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "archibald_engine": {
                "()": ArchibaldEngineFormatter,
                "fmt": "%(asctime)s | %(levelname)-7s | %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "archibald_engine",
                "stream": "ext://sys.stdout",
            },
            "null": {
                "class": "logging.NullHandler",
            },
        },
        "loggers": {
            "": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
            "app": {"level": "INFO", "handlers": ["console"], "propagate": False},
            "uvicorn": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
            "uvicorn.access": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
            "sqlalchemy": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
            "sqlalchemy.engine": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
            "httpx": {"level": "CRITICAL", "handlers": ["null"], "propagate": False},
        },
    }
    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """Obtient un logger configuré"""
    return logging.getLogger(f"app.{name}")


class APILogger:
    """Logger spécialisé pour les API calls"""

    def __init__(self, controller_name: str):
        self.logger = get_logger(f"controllers.{controller_name}")

    def log_request(self, request_data: Dict[str, Any], endpoint: str):
        """Log une requête entrante"""
        self.logger.info(
            "API Request",
            extra={
                "event_type": "api_request",
                "endpoint": endpoint,
                "request_data": {
                    "model": request_data.get("ProviderModel"),
                    "provider": request_data.get("provider"),
                    "has_image": bool(request_data.get("image")),
                    "has_document": bool(request_data.get("document")),
                },
            },
        )

    def log_response(self, response_data: Dict[str, Any], duration: float):
        """Log une réponse"""
        self.logger.info(
            "API Response",
            extra={
                "event_type": "api_response",
                "duration_ms": round(duration * 1000, 2),
                "response_length": len(response_data.get("answer", "")),
                "status": "success",
            },
        )

    def log_error(self, error: Exception, context: str, duration: float = None):
        """Log une erreur"""
        extra_data = {
            "event_type": "api_error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context,
        }

        if duration:
            extra_data["duration_ms"] = round(duration * 1000, 2)

        self.logger.error("API Error", extra=extra_data, exc_info=True)

    def log_model_call(self, model_name: str, provider: str, duration: float):
        """Log un appel à un modèle LLM"""
        self.logger.info(
            "Model Call",
            extra={
                "event_type": "model_call",
                "model": model_name,
                "provider": provider,
                "duration_ms": round(duration * 1000, 2),
            },
        )


# Initialiser le logging au démarrage
setup_logging()
