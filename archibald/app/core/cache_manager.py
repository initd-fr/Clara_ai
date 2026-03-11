import hashlib
import json
from typing import Any, Dict, List, Optional

from app.core.config import settings
from cachetools import TTLCache


class CacheManager:
    """Gestionnaire de cache optimisé pour l'API esclave"""

    def __init__(self):
        # Cache des embeddings avec TTL de 1 heure
        self.embeddings_cache = TTLCache(
            maxsize=settings.CACHE_MAX_SIZE,
            ttl=3600,  # 1 heure
        )

        # Cache des recherches web avec TTL de 30 minutes
        self.web_search_cache = TTLCache(
            maxsize=500,
            ttl=1800,  # 30 minutes
        )

        # Cache des informations de modèles avec TTL de 1 heure
        self.model_info_cache = TTLCache(
            maxsize=100,
            ttl=3600,  # 1 heure
        )

        # Cache des images redimensionnées avec TTL de 10 minutes
        self.image_cache = TTLCache(
            maxsize=200,
            ttl=600,  # 10 minutes
        )

        # Cache des documents similaires avec TTL de 15 minutes
        self.similar_docs_cache = TTLCache(
            maxsize=300,
            ttl=900,  # 15 minutes
        )

    def _generate_key(self, *args, **kwargs) -> str:
        """Génère une clé de cache unique"""
        key_data = {"args": args, "kwargs": sorted(kwargs.items())}
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    def get_embedding(self, text: str) -> Optional[List[float]]:
        """Récupère un embedding du cache"""
        key = self._generate_key("embedding", text)
        return self.embeddings_cache.get(key)

    def set_embedding(self, text: str, embedding: List[float]):
        """Stocke un embedding dans le cache"""
        key = self._generate_key("embedding", text)
        self.embeddings_cache[key] = embedding

    def get_web_search(self, query: str) -> Optional[Dict[str, Any]]:
        """Récupère un résultat de recherche web du cache"""
        key = self._generate_key("web_search", query)
        return self.web_search_cache.get(key)

    def set_web_search(self, query: str, result: Dict[str, Any]):
        """Stocke un résultat de recherche web dans le cache"""
        key = self._generate_key("web_search", query)
        self.web_search_cache[key] = result

    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Récupère les informations d'un modèle du cache"""
        key = self._generate_key("model_info", model_name)
        return self.model_info_cache.get(key)

    def set_model_info(self, model_name: str, info: Dict[str, Any]):
        """Stocke les informations d'un modèle dans le cache"""
        key = self._generate_key("model_info", model_name)
        self.model_info_cache[key] = info

    def get_resized_image(self, image_data: str, max_size: int) -> Optional[str]:
        """Récupère une image redimensionnée du cache"""
        key = self._generate_key("resized_image", image_data[:100], max_size)
        return self.image_cache.get(key)

    def set_resized_image(self, image_data: str, max_size: int, resized_data: str):
        """Stocke une image redimensionnée dans le cache"""
        key = self._generate_key("resized_image", image_data[:100], max_size)
        self.image_cache[key] = resized_data

    def get_similar_documents(
        self, question: str, model_id: int, limit: int
    ) -> Optional[List[Dict[str, Any]]]:
        """Récupère des documents similaires du cache"""
        key = self._generate_key("similar_docs", question, model_id, limit)
        return self.similar_docs_cache.get(key)

    def set_similar_documents(
        self, question: str, model_id: int, limit: int, docs: List[Dict[str, Any]]
    ):
        """Stocke des documents similaires dans le cache"""
        key = self._generate_key("similar_docs", question, model_id, limit)
        self.similar_docs_cache[key] = docs

    def get_cache_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        return {
            "embeddings_cache": {
                "size": len(self.embeddings_cache),
                "maxsize": self.embeddings_cache.maxsize,
                "ttl": self.embeddings_cache.ttl,
            },
            "web_search_cache": {
                "size": len(self.web_search_cache),
                "maxsize": self.web_search_cache.maxsize,
                "ttl": self.web_search_cache.ttl,
            },
            "model_info_cache": {
                "size": len(self.model_info_cache),
                "maxsize": self.model_info_cache.maxsize,
                "ttl": self.model_info_cache.ttl,
            },
            "image_cache": {
                "size": len(self.image_cache),
                "maxsize": self.image_cache.maxsize,
                "ttl": self.image_cache.ttl,
            },
            "similar_docs_cache": {
                "size": len(self.similar_docs_cache),
                "maxsize": self.similar_docs_cache.maxsize,
                "ttl": self.similar_docs_cache.ttl,
            },
        }

    def clear_cache(self, cache_type: Optional[str] = None):
        """Vide le cache spécifié ou tous les caches"""
        if cache_type == "embeddings":
            self.embeddings_cache.clear()
        elif cache_type == "web_search":
            self.web_search_cache.clear()
        elif cache_type == "model_info":
            self.model_info_cache.clear()
        elif cache_type == "image":
            self.image_cache.clear()
        elif cache_type == "similar_docs":
            self.similar_docs_cache.clear()
        else:
            # Vide tous les caches
            self.embeddings_cache.clear()
            self.web_search_cache.clear()
            self.model_info_cache.clear()
            self.image_cache.clear()
            self.similar_docs_cache.clear()


# Instance globale du cache manager
cache_manager = CacheManager()  # Instance globale du cache manager
cache_manager = CacheManager()
