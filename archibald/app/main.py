#
# ~ #######################################/ IMPORTS /###########################################
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.controllers.Chat import anthropic, google, mistral_controller, openai
from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.db import init_db, test_db_connection
from app.middlewares import auth
from app.middlewares import logging as logging_mw

load_dotenv()

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Démarrage Archibald Engine v1...")
    try:
        init_db()
        if not test_db_connection():
            logger.error("Connexion base de données échouée")
            raise Exception("Database connection failed")
        logger.info("Archibald Engine v1 démarré avec succès")
    except Exception as e:
        logger.error("Échec au démarrage: %s", e)
        raise
    yield
    logger.info("Arrêt Archibald Engine v1")


# Configuration de l'API
app = FastAPI(
    title="Archibald Engine",
    description="Archibald Engine v1 – API moteur IA (LLM, RAG, embeddings, recherche web)",
    version="1.0.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Middlewares personnalisés (auth puis logging des requêtes)
app.middleware("http")(auth.verify_api_key)
app.middleware("http")(logging_mw.log_requests)

# * ####################################/ ROUTER / ############################################/
app.include_router(openai.router)
app.include_router(mistral_controller.router)
app.include_router(anthropic.router)
app.include_router(google.router)
# * ####################################/ ROUTER / ############################################/


# & ####################################/ FUNCTIONS / ############################################/


# * ####################################/ CONTROLLER DE TEST / ############################################/
@app.get("/health")
async def health_check():
    """Endpoint de santé minimal - API Key requise"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api": "Archibald Engine v1.0.0",
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log et renvoie le détail des erreurs de validation (422) pour faciliter le debug."""
    errors = exc.errors()
    logger.warning(
        "Validation requête échouée | %s %s | erreurs: %s",
        request.method,
        request.url.path,
        errors,
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Erreur de validation du body (champ manquant, type incorrect ou limite dépassée).",
            "errors": [
                {
                    "loc": e.get("loc"),
                    "msg": e.get("msg"),
                    "type": e.get("type"),
                }
                for e in errors
            ],
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Erreur non gérée | %s %s | %s: %s",
        request.method,
        request.url.path,
        type(exc).__name__,
        exc,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": type(exc).__name__,
            "timestamp": datetime.now().isoformat(),
        },
    )


# * ####################################/ CONTROLLER DE TEST / ############################################/
