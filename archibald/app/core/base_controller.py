import asyncio
import base64
import imghdr
import io
import re
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_openai import OpenAIEmbeddings
from PIL import Image

from app.core.cache_manager import cache_manager
from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.db import SessionLocal
from app.db.models_sqlalchemy import iaLlm
from app.Types.types import ChatRequest, ChatResponse
from app.utils.token_allocator import TokenAllocator
from app.utils.web_search.base_search import base_search, read_url_content


class CustomPGVectorStore(VectorStore):
    """Custom VectorStore qui utilise directement la table Document existante"""

    def __init__(self, connection_string: str, embedding_model):
        self.connection_string = connection_string
        self._embedding_model = embedding_model
        self._connection_pool = None
        self._embedding_cache = {}  # Cache des embeddings de requête
        self._init_connection_pool()

    def _init_connection_pool(self):
        """Initialise le pool de connexions psycopg2"""
        try:
            # Nettoyer la connection string
            import re

            clean_connection_string = re.sub(
                r"([&?])pgbouncer=true&?", r"\1", self.connection_string
            )
            clean_connection_string = re.sub(r"[&?]$", "", clean_connection_string)

            # Créer le pool de connexions
            from psycopg2 import pool

            self._connection_pool = pool.ThreadedConnectionPool(
                minconn=10,  # Minimum 10 connexions (augmenté)
                maxconn=50,  # Maximum 50 connexions (augmenté)
                dsn=clean_connection_string,
            )
        except Exception:
            self._connection_pool = None

    def _get_connection(self):
        """Obtient une connexion du pool"""
        if self._connection_pool:
            try:
                return self._connection_pool.getconn()
            except Exception:
                return None
        return None

    def _return_connection(self, conn):
        """Retourne une connexion au pool"""
        if self._connection_pool and conn:
            try:
                self._connection_pool.putconn(conn)
            except Exception:
                pass

    async def _get_query_embedding_async(self, query: str) -> str:
        """Génère ou récupère l'embedding de la requête avec cache global - VERSION ASYNC"""
        # Vérifier le cache global d'abord
        cached_embedding = cache_manager.get_embedding(query)
        if cached_embedding:
            return "[" + ",".join(map(str, cached_embedding)) + "]"

        # Générer l'embedding si pas en cache - EXÉCUTER DANS UN THREAD POOL
        import asyncio
        import concurrent.futures

        # Exécuter l'embedding dans un thread pool pour ne pas bloquer l'event loop
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            query_embedding = await loop.run_in_executor(
                executor, self._embedding_model.embed_query, query
            )

        query_embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

        # Mettre en cache global (TTL 1h, max 1000 embeddings)
        cache_manager.set_embedding(query, query_embedding)

        return query_embedding_str

    async def similarity_search_with_score_async(
        self, query: str, k: int = 3, filter: dict = None
    ) -> List[tuple]:
        """Recherche de similarité avec scores - VERSION ASYNC OPTIMISÉE"""
        from psycopg2.extras import RealDictCursor

        # Générer l'embedding de la requête avec cache - ASYNC
        query_embedding_str = await self._get_query_embedding_async(query)

        # Exécuter la requête psycopg2 dans un thread pool pour ne pas bloquer l'event loop
        import asyncio
        import concurrent.futures

        def _execute_sql_sync():
            # Utiliser le pool de connexions
            conn = self._get_connection()
            if not conn:
                # Fallback vers connexion directe si pool indisponible
                return self._fallback_search(query, k, filter, query_embedding_str)

            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Requête de similarité vectorielle optimisée
                    sql = """
                    SELECT id, name, text, "minioPath", "mimeType", size,
                           "segmentOrder", "pageNumber", "createdAt", "updatedAt", "modelId",
                           (embedding <-> %s::vector) as distance
                    FROM "Document"
                    WHERE "modelId" = %s AND embedding IS NOT NULL
                    ORDER BY embedding <-> %s::vector
                    LIMIT %s
                    """

                    cur.execute(
                        sql,
                        (
                            query_embedding_str,
                            filter.get("modelId"),
                            query_embedding_str,
                            k,
                        ),
                    )
                    rows = cur.fetchall()

                    # Convertir en documents LangChain
                    docs_with_scores = []
                    for row in rows:
                        doc = Document(
                            page_content=row["text"] or "",
                            metadata={
                                "id": row["id"],
                                "name": row["name"],
                                "minioPath": row["minioPath"],
                                "mimeType": row["mimeType"],
                                "size": row["size"],
                                "segmentOrder": row["segmentOrder"],
                                "pageNumber": row["pageNumber"],
                                "createdAt": row["createdAt"],
                                "updatedAt": row["updatedAt"],
                                "modelId": row["modelId"],
                            },
                        )
                        docs_with_scores.append((doc, float(row["distance"])))

                    return docs_with_scores

            except Exception:
                return []
            finally:
                # Retourner la connexion au pool
                self._return_connection(conn)

        # Exécuter dans un thread pool
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            return await loop.run_in_executor(executor, _execute_sql_sync)

    def _fallback_search(
        self, query: str, k: int, filter: dict, query_embedding_str: str
    ) -> List[tuple]:
        """Fallback vers connexion directe si pool indisponible"""
        import re

        import psycopg2
        from psycopg2.extras import RealDictCursor

        clean_connection_string = re.sub(
            r"([&?])pgbouncer=true&?", r"\1", self.connection_string
        )
        clean_connection_string = re.sub(r"[&?]$", "", clean_connection_string)

        try:
            with psycopg2.connect(clean_connection_string) as conn:
                conn.set_client_encoding("UTF8")
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    sql = """
                    SELECT id, name, text, "minioPath", "mimeType", size,
                           "segmentOrder", "pageNumber", "createdAt", "updatedAt", "modelId",
                           (embedding <-> %s::vector) as distance
                    FROM "Document"
                    WHERE "modelId" = %s AND embedding IS NOT NULL
                    ORDER BY embedding <-> %s::vector
                    LIMIT %s
                    """
                    cur.execute(
                        sql,
                        (
                            query_embedding_str,
                            filter.get("modelId"),
                            query_embedding_str,
                            k,
                        ),
                    )
                    rows = cur.fetchall()

                    docs_with_scores = []
                    for row in rows:
                        doc = Document(
                            page_content=row["text"] or "",
                            metadata={
                                "id": row["id"],
                                "name": row["name"],
                                "minioPath": row["minioPath"],
                                "mimeType": row["mimeType"],
                                "size": row["size"],
                                "segmentOrder": row["segmentOrder"],
                                "pageNumber": row["pageNumber"],
                                "createdAt": row["createdAt"],
                                "updatedAt": row["updatedAt"],
                                "modelId": row["modelId"],
                            },
                        )
                        docs_with_scores.append((doc, float(row["distance"])))

                    return docs_with_scores
        except Exception:
            return []

    def similarity_search(
        self, query: str, k: int = 5, filter: dict = None
    ) -> List[Document]:
        """Recherche de similarité simple"""
        docs_with_scores = self.similarity_search_with_score(query, k, filter)
        return [doc for doc, score in docs_with_scores]

    def add_texts(self, texts: List[str], metadatas: List[dict] = None) -> List[str]:
        """Méthode requise par VectorStore (non utilisée)"""
        raise NotImplementedError("Cette méthode n'est pas implémentée")

    @classmethod
    def from_texts(cls, texts, embedding, metadatas=None, **kwargs):
        """Implémentation requise par VectorStore (non utilisée)"""
        raise NotImplementedError(
            "L'insertion de textes n'est pas supportée. Utilisez Next.js pour insérer vos embeddings."
        )

    def as_retriever(self, **kwargs):
        """Créer un retriever"""
        from langchain_core.retrievers import BaseRetriever

        class CustomRetriever(BaseRetriever):
            def __init__(self, vectorstore, **kwargs):
                super().__init__(**kwargs)
                self._vs = vectorstore

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self._vs.similarity_search(query, **kwargs)

        return CustomRetriever(self)


class _NoOpLogger:
    def info(self, *args, **kwargs): pass
    def error(self, *args, **kwargs): pass
    def warning(self, *args, **kwargs): pass
    def debug(self, *args, **kwargs): pass


class BaseChatController(ABC):
    """Classe de base pour tous les contrôleurs de chat LLM"""

    def __init__(self, router: APIRouter):
        self.router = router
        self.client_cache = {}
        self.logger = get_logger("rag")

    @abstractmethod
    def get_client(self, model_name: str):
        """Retourne le client LLM spécifique"""
        pass

    @abstractmethod
    def prepare_messages(
        self, messages: List[Dict[str, str]], image_content: str = None
    ) -> List[Dict[str, Any]]:
        """Prépare les messages pour l'API spécifique"""
        pass

    @abstractmethod
    async def invoke_model(self, client, messages, **kwargs) -> str:
        """Appelle le modèle LLM spécifique"""
        pass

    def _get_vectorstore_retriever(self, model_id: int, limit: int = 3):
        """Crée un retriever PGVector optimisé avec cache et réutilisation"""
        # Cache key pour le retriever
        cache_key = f"retriever_{model_id}_{limit}"

        # Vérifier le cache d'abord
        if hasattr(self, "_retriever_cache") and cache_key in self._retriever_cache:
            return self._retriever_cache[cache_key]

        # Initialiser le cache si nécessaire
        if not hasattr(self, "_retriever_cache"):
            self._retriever_cache = {}

        # Créer les embeddings (réutiliser si possible)
        if not hasattr(self, "_cached_embeddings"):
            self._cached_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

        # Créer le vectorstore custom qui utilise ta table Document
        vectorstore = CustomPGVectorStore(
            connection_string=settings.DATABASE_URL,
            embedding_model=self._cached_embeddings,
        )

        # Créer le retriever
        retriever = vectorstore.as_retriever(k=limit)

        # Mettre en cache
        self._retriever_cache[cache_key] = retriever

        return retriever

    def log_request(self, request: ChatRequest, endpoint: str):
        """Log une requête entrante (modèle, provider, endpoint)."""
        self.logger.info(
            "Request %s | model=%s provider=%s",
            endpoint,
            getattr(request, "ProviderModel", ""),
            getattr(request, "provider", ""),
        )

    def log_error(self, error: Exception, context: str):
        """Log une erreur dans le contexte donné."""
        self.logger.error("%s: %s", context, error, exc_info=False)

    async def retry_with_backoff(
        self, func, max_retries=3, initial_delay=1, max_delay=3, overall_timeout=30
    ):
        """Retry avec backoff exponentiel court, adapté à la prod

        - initial_delay: délai initial (secondes)
        - max_delay: plafond du backoff (secondes)
        - overall_timeout: timeout global cumulé (secondes)
        """
        delay = initial_delay
        last_error = None
        user_notified = False
        start_overall = time.time()

        for attempt in range(max_retries):
            try:
                result = await func()
                return result
            except Exception as e:
                self.log_error(e, f"attempt_{attempt + 1}")
                last_error = e

                if "overloaded" in str(e).lower():
                    if not user_notified:
                        user_notified = True
                        return JSONResponse(
                            status_code=202,
                            content={
                                "message": "Les serveurs sont actuellement surchargés. Votre requête est en cours de traitement, veuillez patienter...",
                                "status": "processing",
                                "estimated_wait": "2 minutes",
                            },
                        )

                    # Backoff court plafonné
                    await asyncio.sleep(delay)
                    delay = min(delay + 1, max_delay)

                # Timeout global de sécurité
                if (time.time() - start_overall) > overall_timeout:
                    break

        raise last_error

    def fix_base64_padding(self, base64_string: str) -> str:
        """Corrige le padding d'une chaîne base64"""
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += "=" * (4 - missing_padding)
        return base64_string

    def clean_base64_string(self, base64_string: str) -> str:
        """Nettoie une chaîne base64"""
        # Retire le préfixe data:image/...;base64,
        if ";base64," in base64_string:
            base64_string = base64_string.split(";base64,")[1]

        # Retire les caractères non base64
        base64_string = re.sub(r"[^A-Za-z0-9+/]", "", base64_string)

        # Ajoute le padding si nécessaire
        return self.fix_base64_padding(base64_string)

    def detect_image_type(self, image_data: str) -> str:
        """Détecte le type MIME d'une image"""
        try:
            image_data = self.clean_base64_string(image_data)
            image_bytes = base64.b64decode(image_data)
            image_type = imghdr.what(None, h=image_bytes)

            type_mapping = {
                "jpeg": "image/jpeg",
                "png": "image/png",
                "gif": "image/gif",
                "webp": "image/webp",
            }

            return type_mapping.get(image_type, "image/jpeg")
        except Exception as e:
            self.log_error(e, "image_type_detection")
            return "image/jpeg"

    def resize_image(self, image_data: str, max_size: int = 1024) -> str:
        """Redimensionne une image en base64 avec cache"""
        # Vérifier le cache d'abord
        cached_image = cache_manager.get_resized_image(image_data, max_size)
        if cached_image:
            return cached_image

        try:
            image_data = self.clean_base64_string(image_data)
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            # Calcul des nouvelles dimensions
            width, height = image.size
            if width > height:
                new_width = min(width, max_size)
                new_height = int(height * (new_width / width))
            else:
                new_height = min(height, max_size)
                new_width = int(width * (new_height / height))

            # Redimensionnement
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Conversion en PNG et encodage
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            resized_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

            # Mettre en cache
            cache_manager.set_resized_image(image_data, max_size, resized_data)

            return resized_data
        except Exception as e:
            self.log_error(e, "image_resize")
            return image_data

    async def search_similar_documents(
        self,
        question: str,
        model_id: int,
        limit: int = 3,
        model_name: str = None,
        max_tokens: int = 1024,
        provider: str = "openai",
    ) -> List[Dict[str, Any]]:
        """Recherche des documents similaires avec cache et LangChain PGVector"""
        rag_total_start = time.time()
        fetch_start = None
        build_start = None
        # Vérifier le cache d'abord
        cached_docs = cache_manager.get_similar_documents(question, model_id, limit)
        if cached_docs:
            self.logger.info(
                "[RAG] Cache hit: %s document(s) trouvé(s) pour model_id=%s (question tronquée: %s...)",
                len(cached_docs),
                model_id,
                (question[:60] + "..." if len(question) > 60 else question),
            )
            return cached_docs

        try:
            self.logger.info(
                "[RAG] Recherche similar_documents | model_id=%s | limit=%s | question: %s",
                model_id,
                limit,
                question[:120] + ("..." if len(question) > 120 else ""),
            )

            # Utiliser le retriever optimisé avec cache
            retriever = self._get_vectorstore_retriever(model_id, limit)

            # Récupérer le vectorstore depuis le retriever
            vectorstore = retriever._vs

            # Recherche des documents similaires avec filtre par modelId - ASYNC
            fetch_start = time.time()
            docs_with_scores = await vectorstore.similarity_search_with_score_async(
                question, k=limit, filter={"modelId": model_id}
            )
            fetch_ms = round((time.time() - fetch_start) * 1000, 2)
            self.logger.info(
                "[RAG] Recherche pgvector terminée en %sms | %s segment(s) trouvé(s) (avant filtre)",
                fetch_ms,
                len(docs_with_scores),
            )
            if not docs_with_scores:
                self.logger.warning(
                    "[RAG] Aucun document en base pour model_id=%s (ou embedding NULL). Vérifier que des docs sont indexés.",
                    model_id,
                )
                return []

            # Log des distances brutes (pgvector L2) pour debug
            distances = [round(float(score), 4) for _, score in docs_with_scores]
            self.logger.info(
                "[RAG] Distances brutes des %s segment(s) (avant filtre): %s",
                len(distances),
                distances,
            )

            # Filtrer par seuil de distance. Seuil 0.85 = plus permissif (0.5 était trop strict, les meilleurs matches étaient écartés).
            threshold_distance = 0.85
            before_filter = len(docs_with_scores)
            docs_filtered = [
                (doc, score)
                for (doc, score) in docs_with_scores
                if float(score) <= threshold_distance
            ]
            # Si le seuil élimine tout, garder quand même les N meilleurs (déjà triés par similarité) pour ne pas perdre le CV / docs pertinents
            if len(docs_filtered) == 0:
                docs_filtered = docs_with_scores[:limit]
                self.logger.warning(
                    "[RAG] Toutes les distances > %s (valeurs: %s). On garde quand même les %s meilleur(s) segment(s).",
                    threshold_distance,
                    distances,
                    len(docs_filtered),
                )
            docs_with_scores = docs_filtered
            self.logger.info(
                "[RAG] Filtre pertinence (distance <= %s): %s/%s segment(s) retenus",
                threshold_distance,
                len(docs_with_scores),
                before_filter,
            )
            if not docs_with_scores:
                return []

            # Convertir en format Document standard
            docs = [doc for doc, score in docs_with_scores]

            # Formater les résultats LangChain
            build_start = time.time()
            similar_docs = []
            for i, (doc, score) in enumerate(docs_with_scores):
                # Extraire les métadonnées
                metadata = doc.metadata
                text_content = doc.page_content or ""

                # Nettoyer le texte du document
                text_content = re.sub(r"^[^\w\s]*", "", text_content)

                # Calculer les métriques de qualité avec le score de LangChain
                distance = float(score)  # Score de distance de LangChain
                similarity = 1 - distance  # Convertir distance en similarité
                relevance_score = similarity * 100  # Score de pertinence en %

                doc_info = {
                    "id": metadata.get("id"),
                    "name": metadata.get("name", ""),
                    "text": text_content,
                    "minioPath": metadata.get("minioPath", ""),
                    "mimeType": metadata.get("mimeType", ""),
                    "size": metadata.get("size", 0),
                    "segmentOrder": metadata.get("segmentOrder", 0),
                    "pageNumber": metadata.get("pageNumber", 0),
                    "createdAt": metadata.get("createdAt"),
                    "updatedAt": metadata.get("updatedAt"),
                    "relevance_score": relevance_score,
                    "similarity": similarity,
                    "distance": distance,
                }
                similar_docs.append(doc_info)

                # Log détaillé avec métriques de qualité
                self.logger.info(
                    "[RAG] Doc %s/%s | id=%s | %s | distance=%.4f | pertinence=%.0f%% | page=%s | %s car",
                    i + 1,
                    len(docs),
                    doc_info["id"],
                    doc_info["name"][:50],
                    distance,
                    relevance_score,
                    doc_info["pageNumber"],
                    len(text_content),
                )
                self.logger.debug(
                    "  aperçu: %s", (text_content[:200] + "..." if len(text_content) > 200 else text_content)
                )

            build_ms = round((time.time() - build_start) * 1000, 2)

            # Log du contexte RAG final
            rag_context = "\n\n".join([doc["text"] for doc in similar_docs])
            rag_total_ms = round((time.time() - rag_total_start) * 1000, 2)
            self.logger.info(
                "[RAG] Contexte final: %s document(s) | %s caractères | fetch=%sms build=%sms total=%sms",
                len(similar_docs),
                len(rag_context),
                fetch_ms,
                build_ms,
                rag_total_ms,
            )
            if not settings.is_production and rag_context:
                self.logger.info("[RAG] Aperçu contexte (500 car): %s", rag_context[:500] + ("..." if len(rag_context) > 500 else ""))

            # Mettre en cache
            cache_manager.set_similar_documents(question, model_id, limit, similar_docs)

            return similar_docs
        except Exception as e:
            self.log_error(e, "similar_documents_search")
            # Log détaillé pour debug
            self.logger.error(
                f"Detailed error in similar_documents_search: {str(e)}", exc_info=True
            )
            return []

    async def process_web_search(self, question: str) -> str:
        """Traite la recherche web avec cache"""
        # Vérifier le cache d'abord
        cached_result = cache_manager.get_web_search(question)
        if cached_result:
            return cached_result.get("content", "")

        try:
            # Vérifier si une recherche web est nécessaire
            search_keywords = [
                "recherche",
                "trouve",
                "cherche",
                "info",
                "actualité",
                "news",
                "recherches",
                "rechercher",
                "trouver",
                "chercher",
                "informations",
                "conseil",
                "conseille",
                "recommandation",
                "recommandations",
                "comparaison",
                "comparer",
                "différence",
                "différences",
                "prix",
                "coût",
                "budget",
                "acheter",
                "achat",
                "meilleur",
                "meilleure",
                "top",
                "classement",
                "avis",
                "test",
                "évaluation",
                "note",
            ]

            # Détection plus intelligente des besoins de recherche
            question_lower = question.lower()
            needs_search = any(keyword in question_lower for keyword in search_keywords)

            # Détection des questions de comparaison
            comparison_words = ["vs", "versus", "ou", "comparaison", "différence"]
            is_comparison = any(word in question_lower for word in comparison_words)

            # Détection des questions sur des produits/services
            product_words = [
                "ordinateur",
                "laptop",
                "pc",
                "mac",
                "windows",
                "macos",
                "marque",
                "modèle",
            ]
            is_product_question = any(word in question_lower for word in product_words)

            # Détection des questions d'actualité
            news_words = [
                "actualité",
                "news",
                "récent",
                "nouveau",
                "dernière",
                "aujourd'hui",
            ]
            is_news_question = any(word in question_lower for word in news_words)

            if needs_search or is_comparison or is_product_question or is_news_question:
                self.logger.info(f"Web search needed for question: {question}")
                search_results = await base_search(question)

                # Extraire le contenu des résultats
                content = ""
                if search_results.get("results"):
                    for result in search_results["results"]:
                        content += f"**{result.get('title', '')}**\n"
                        content += f"URL: {result.get('url', '')}\n"
                        content += f"{result.get('content', '')}\n\n"

                # Mettre en cache
                cache_manager.set_web_search(question, {"content": content})

                return content

            # Si une URL est présente dans la question, l'extraire
            url_pattern = r"https?://[^\s]+"
            urls = re.findall(url_pattern, question)

            if urls:
                url = urls[0]
                self.logger.info(f"URL detected: {url}")
                try:
                    content = await read_url_content(url)
                    result_content = content.get("content", "")

                    # Mettre en cache
                    cache_manager.set_web_search(question, {"content": result_content})

                    return result_content
                except Exception as e:
                    self.log_error(e, "url_content_reading")
                    return ""

            return ""
        except Exception as e:
            self.log_error(e, "web_search_processing")
            return ""

    def process_document(self, request: ChatRequest) -> str:
        """Traite le document temporaire"""
        if not request.document:
            return ""

        try:
            return request.document.content
        except Exception as e:
            self.log_error(e, "document_processing")
            return ""

    def process_image(self, request: ChatRequest) -> str:
        """Traite l'image si présente avec cache"""
        if not request.image:
            return ""

        try:
            # Redimensionner l'image si nécessaire avec cache
            return self.resize_image(request.image)
        except Exception as e:
            self.log_error(e, "image_processing")
            return ""

    async def get_model_info_async(
        self, provider_model: str
    ) -> Optional[Dict[str, Any]]:
        """Récupère les informations du modèle depuis la DB avec cache"""
        # Vérifier le cache d'abord
        cached_info = cache_manager.get_model_info(provider_model)
        if cached_info:
            return cached_info

        try:
            # Exécuter la requête SQLAlchemy dans un thread pool
            import asyncio
            import concurrent.futures

            def _query_model_info_sync():
                with SessionLocal() as session:
                    model_info = (
                        session.query(iaLlm)
                        .filter(iaLlm.value == provider_model)
                        .first()
                    )
                    if model_info:
                        return {
                            "maxInputTokens": model_info.maxInputTokens,
                            "maxOutputTokens": model_info.maxOutputTokens,
                            "temperatureForcedValue": model_info.temperatureForcedValue,
                            "temperatureIsForced": model_info.temperatureIsForced,
                        }
                    return None

            # Exécuter dans un thread pool
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                info = await loop.run_in_executor(executor, _query_model_info_sync)

                if info:
                    # Mettre en cache
                    cache_manager.set_model_info(provider_model, info)
                    return info
                return None
        except Exception as e:
            self.log_error(e, "model_info_retrieval")
            return None

    def create_token_allocator(
        self,
        request: ChatRequest,
        rag_context: str = "",
        document_content: str = "",
        web_search: str = "",
    ) -> TokenAllocator:
        """Crée et configure le TokenAllocator"""
        return TokenAllocator(
            model_prompt=request.promptVariables.modelPrompt,
            last_exchange=request.promptVariables.lastExchange,
            rag=rag_context,
            temporary_document_content=document_content,
            web_search_result=web_search,
            question=request.question,
            model_name=request.ProviderModel,
            system_prompt_template=request.systemPrompt or "",
            max_input_tokens=request.maxInputTokens or 4000,
            provider=request.provider,
            reserve_tokens=1000,
        )

    async def agent_completion(self, request: ChatRequest) -> ChatResponse:
        """Implémentation générique pour le mode agent"""
        self.log_request(request, "agent")

        # Timeout global de 60 secondes pour éviter les requêtes qui traînent
        try:
            return await asyncio.wait_for(
                self._agent_completion_impl(request), timeout=60.0
            )
        except asyncio.TimeoutError:
            self.logger.error("Agent completion timeout after 60 seconds")
            raise HTTPException(
                status_code=504, detail="Request timeout - please try again"
            ) from None

    async def _agent_completion_impl(self, request: ChatRequest) -> ChatResponse:
        start_time = time.time()

        try:
            # Traitement de la recherche web avec cache
            web_search = await self.process_web_search(request.question)

            # Traitement du document
            document_content = self.process_document(request)

            # Traitement de l'image avec cache
            image_content = self.process_image(request)

            # Construction des messages
            messages = []

            # Remplacer les variables dans le système prompt
            system_prompt = request.systemPrompt or ""
            if request.promptVariables:
                system_prompt = system_prompt.replace(
                    "{modelPrompt}", request.promptVariables.modelPrompt
                )
                system_prompt = system_prompt.replace(
                    "{lastExchange}", request.promptVariables.lastExchange
                )
                system_prompt = system_prompt.replace("{crlf}", "\n")

            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})

            # Ajouter le userPrompt
            if request.userPrompt:
                messages.append({"role": "system", "content": request.userPrompt})

            # Construire le message utilisateur avec le contenu du document
            user_content = request.question

            # Ajouter le contenu du document s'il existe
            if document_content:
                user_content += f"\n\n**Contenu du document :**\n{document_content}"

            # Ajouter les résultats de recherche web s'ils existent
            if web_search:
                user_content += f"\n\n**Informations trouvées :**\n{web_search}"

            # Ajouter le message de l'utilisateur
            user_message = {"role": "user", "content": user_content}
            if image_content:
                user_message["image"] = image_content
            messages.append(user_message)

            # Log du message utilisateur final
            self.logger.info("Message utilisateur (agent):")
            self.logger.info(f"  - Longueur: {len(user_content)} caractères")
            self.logger.info("  - Contenu:")
            self.logger.info("-" * 80)
            self.logger.info(user_content)
            self.logger.info("-" * 80)

            # Préparer les messages pour l'API spécifique
            prepared_messages = self.prepare_messages(messages, image_content)

            # Obtenir le client
            client = self.get_client(request.ProviderModel)

            # Appeler le modèle avec retry
            async def invoke_model_async():
                return await self.invoke_model(
                    client,
                    prepared_messages,
                    **{
                        "model": request.ProviderModel,
                        "max_tokens": request.maxOutputTokens,
                    },
                )

            content = await self.retry_with_backoff(invoke_model_async)

            content_str = (content or "").strip()
            if not content_str:
                self.logger.error("LLM returned empty content (agent)")
                raise HTTPException(
                    status_code=502,
                    detail="Le modèle n'a pas renvoyé de contenu. Réessayez ou changez de modèle.",
                )

            duration = time.time() - start_time
            self.logger.info(
                "Agent completion completed",
                extra={
                    "duration_ms": round(duration * 1000, 2),
                    "model": request.ProviderModel,
                },
            )

            return ChatResponse(answer=content_str)

        except Exception as e:
            duration = time.time() - start_time
            self.log_error(e, "agent_completion")
            raise HTTPException(status_code=500, detail=str(e)) from e

    async def expert_completion(self, request: ChatRequest) -> ChatResponse:
        """Implémentation générique pour le mode expert"""
        self.log_request(request, "expert")

        # Timeout global de 60 secondes pour éviter les requêtes qui traînent
        try:
            return await asyncio.wait_for(
                self._expert_completion_impl(request), timeout=60.0
            )
        except asyncio.TimeoutError:
            self.logger.error("Expert completion timeout after 60 seconds")
            raise HTTPException(
                status_code=504, detail="Request timeout - please try again"
            ) from None

    async def _expert_completion_impl(self, request: ChatRequest) -> ChatResponse:
        start_time = time.time()

        try:
            similar_docs = await self.search_similar_documents(
                question=request.question,
                model_id=request.modelId,
                provider=request.provider,
            )

            self.logger.info(
                "[RAG] Mode expert | model_id=%s | %s document(s) pertinent(s) pour injection dans le prompt",
                request.modelId,
                len(similar_docs),
            )

            # Construire le contexte RAG formaté
            rag_context = ""
            if similar_docs:
                # Formater les docs RAG comme dans Next.js (formatRAGSources)
                rag_context = "\n".join(
                    [
                        f"Doc: {doc['name']} (p.{doc.get('pageNumber', 'N/A')}): {doc['text'][:400]}..."
                        for doc in similar_docs
                    ]
                )
            else:
                pass

            # Traitement de la recherche web avec cache
            web_search = await self.process_web_search(request.question)

            # Traitement du document
            document_content = self.process_document(request)

            # Traitement de l'image avec cache
            image_content = self.process_image(request)

            # Construction des messages
            messages = []

            # Remplacer les variables dans le système prompt
            system_prompt = request.systemPrompt or ""
            if request.promptVariables:
                system_prompt = system_prompt.replace(
                    "{modelPrompt}", request.promptVariables.modelPrompt
                )
                system_prompt = system_prompt.replace(
                    "{lastExchange}", request.promptVariables.lastExchange
                )
                system_prompt = system_prompt.replace("{crlf}", "\n")

            # Log du systemPrompt original avant injection RAG
            self.logger.info("SystemPrompt avant injection RAG:")
            self.logger.info(f"  - Longueur: {len(system_prompt)} caractères")
            self.logger.info(f"  - Contient {{rag}}: {'{rag}' in system_prompt}")
            self.logger.info(f"  - Aperçu: {system_prompt[:200]}...")

            # Injecter le contexte RAG dans le prompt système
            if rag_context:
                # Vérifier si le placeholder {rag} existe dans le systemPrompt
                if "{rag}" in system_prompt:
                    system_prompt = system_prompt.replace("{rag}", rag_context)
                    self.logger.info(
                        "Contexte RAG injecté dans le systemPrompt via placeholder {rag}"
                    )
                else:
                    # Si pas de placeholder, ajouter le contexte RAG à la fin
                    system_prompt += f"\n\nContexte RAG:\n{rag_context}"
                    self.logger.info(
                        "Contexte RAG ajouté à la fin du systemPrompt (pas de placeholder {rag})"
                    )

                self.logger.info(
                    f"  - RAG context length: {len(rag_context)} caractères"
                )
                self.logger.info(f"  - RAG context preview: {rag_context[:300]}...")
            else:
                # Si pas de RAG, remplacer par un message vide
                system_prompt = system_prompt.replace("{rag}", "")
                self.logger.info(
                    "Aucun contexte RAG - placeholder {rag} remplacé par vide"
                )

            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})

                # Log du prompt système final
                self.logger.info("Prompt système envoyé au modèle:")
                self.logger.info(
                    f"  - Longueur totale: {len(system_prompt)} caractères"
                )
                self.logger.info("  - Contenu complet:")
                self.logger.info("=" * 80)
                self.logger.info(system_prompt)
                self.logger.info("=" * 80)

            # Ajouter le userPrompt
            if request.userPrompt:
                messages.append({"role": "system", "content": request.userPrompt})

            # RAG context is now handled via systemPrompt - no separate message needed
            # if rag_context:
            #     rag_message = {
            #         "role": "system",
            #         "content": f"Contexte RAG:\n{rag_context}",
            #     }
            #     messages.append(rag_message)
            #     self.logger.info("Message RAG ajouté au contexte:")
            #     self.logger.info(
            #         f"  - Taille du message RAG: {len(rag_message['content'])} caractères"
            #     )
            #     self.logger.info(f"  - Aperçu: {rag_message['content'][:300]}...")

            # Construire le message utilisateur avec le contenu du document
            user_content = request.question

            # Ajouter le contenu du document s'il existe
            if document_content:
                user_content += f"\n\n**Contenu du document :**\n{document_content}"

            # Ajouter les résultats de recherche web s'ils existent
            if web_search:
                user_content += f"\n\n**Informations trouvées :**\n{web_search}"

            # Ajouter le message de l'utilisateur
            user_message = {"role": "user", "content": user_content}
            if image_content:
                user_message["image"] = image_content
            messages.append(user_message)

            # Log du message utilisateur final
            self.logger.info("Message utilisateur (expert):")
            self.logger.info(f"  - Longueur: {len(user_content)} caractères")
            self.logger.info("  - Contenu:")
            self.logger.info("-" * 80)
            self.logger.info(user_content)
            self.logger.info("-" * 80)

            # Préparer les messages pour l'API spécifique
            prepared_messages = self.prepare_messages(messages, image_content)

            # Obtenir le client
            client = self.get_client(request.ProviderModel)

            # Appeler le modèle avec retry
            async def invoke_model_async():
                return await self.invoke_model(
                    client,
                    prepared_messages,
                    **{
                        "model": request.ProviderModel,
                        "max_tokens": request.maxOutputTokens,
                    },
                )

            content = await self.retry_with_backoff(invoke_model_async)

            content_str = (content or "").strip()
            if not content_str:
                self.logger.error("LLM returned empty content (expert)")
                raise HTTPException(
                    status_code=502,
                    detail="Le modèle n'a pas renvoyé de contenu. Réessayez ou changez de modèle.",
                )

            duration = time.time() - start_time
            self.logger.info(
                "Expert completion completed",
                extra={
                    "duration_ms": round(duration * 1000, 2),
                    "model": request.ProviderModel,
                },
            )

            # Log de la réponse renvoyée au client
            self.logger.info("ChatResponse (expert):")
            self.logger.info(f"  - Answer length: {len(content_str)} caractères")
            self.logger.info(f"  - Answer preview: {content_str[:200]}...")
            self.logger.info(f"  - Documents count: {len(similar_docs)}")
            if similar_docs:
                self.logger.info("  - Documents details:")
                for i, doc in enumerate(similar_docs[:3]):  # Log des 3 premiers docs
                    self.logger.info(
                        f"    [{i + 1}] {doc.get('name', 'N/A')} (p.{doc.get('pageNumber', 'N/A')}) - {len(doc.get('text', ''))} chars"
                    )
            else:
                self.logger.info("  - Aucun document retourné")

            return ChatResponse(answer=content_str, documents=similar_docs)

        except Exception as e:
            duration = time.time() - start_time
            self.log_error(e, "expert_completion")
            raise HTTPException(status_code=500, detail=str(e)) from e
