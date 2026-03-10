##
# ~ IMPORTS
import os
import time
from typing import Any, Dict, List

from anthropic import Anthropic
from fastapi import APIRouter

from app.core.base_controller import BaseChatController
from app.core.logging_config import APILogger

# ~ IMPORTS LANGCHAIN
# ? #######################################/ TYPES/ ###########################################/
from app.Types.types import ChatResponse

# ~ IMPORTS FONCTIONS

# ? #######################################/ TYPES/ ###########################################/


class AnthropicController(BaseChatController):
    """Contrôleur Anthropic optimisé héritant de BaseChatController"""

    def __init__(self):
        router = APIRouter(prefix="/anthropic", tags=["anthropic"])
        super().__init__(router)
        self.api_logger = APILogger("anthropic")

        # Configuration des routes avec les méthodes héritées
        self.router.add_api_route(
            "/agent",
            self.agent_completion,
            methods=["POST"],
            response_model=ChatResponse,
        )
        self.router.add_api_route(
            "/expert",
            self.expert_completion,
            methods=["POST"],
            response_model=ChatResponse,
        )

    def get_client(self, model_name: str):
        """Retourne le client Anthropic avec cache"""
        cache_key = f"{model_name}"

        if cache_key in self.client_cache:
            return self.client_cache[cache_key]

        client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.client_cache[cache_key] = client
        return client

    def prepare_messages(
        self, messages: List[Dict[str, str]], image_content: str = None
    ) -> List[Dict[str, Any]]:
        """Prépare les messages pour l'API Anthropic"""
        prepared_messages = []

        for msg in messages:
            if msg["role"] == "user" and image_content:
                # Détecter le type d'image
                image_type = self.detect_image_type(image_content)

                # Format Anthropic pour les images
                prepared_messages.append(
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": self._limit_content(msg["content"]),
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": image_type,
                                    "data": image_content,
                                },
                            },
                        ],
                    }
                )
            else:
                prepared_messages.append(
                    {
                        "role": msg["role"],
                        "content": self._limit_content(msg["content"]),
                    }
                )

        return prepared_messages

    def detect_image_type(self, image_data: str) -> str:
        """Détecte le type d'image à partir des données base64"""
        try:
            # Décoder les données base64
            import base64

            image_bytes = base64.b64decode(image_data)

            # Détecter le type avec imghdr
            import imghdr

            image_type = imghdr.what(None, h=image_bytes)

            # Mapper vers les types MIME
            mime_types = {
                "jpeg": "image/jpeg",
                "jpg": "image/jpeg",
                "png": "image/png",
                "gif": "image/gif",
                "bmp": "image/bmp",
                "webp": "image/webp",
            }

            return mime_types.get(image_type, "image/jpeg")  # Par défaut JPEG

        except Exception as e:
            self.api_logger.log_error(e, "image_type_detection")
            return "image/jpeg"  # Fallback

    def _limit_content(self, content: str, max_length: int = 8000) -> str:
        """Limite la taille du contenu pour éviter les timeouts"""
        if len(content) <= max_length:
            return content

        # Tronquer intelligemment
        truncated = content[:max_length]
        # Essayer de couper à la fin d'une phrase
        last_period = truncated.rfind(".")
        last_newline = truncated.rfind("\n")
        cut_point = max(last_period, last_newline)

        if cut_point > max_length * 0.8:  # Si on peut couper proprement
            return (
                truncated[: cut_point + 1]
                + "\n\n[Contenu tronqué pour éviter le timeout]"
            )
        return truncated + "\n\n[Contenu tronqué pour éviter le timeout]"

    async def invoke_model(self, client, messages, **kwargs) -> str:
        """Appelle le modèle Anthropic"""
        start_time = time.time()

        try:
            # Séparer les messages système des autres messages
            system_messages = []
            user_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_messages.append(msg["content"])
                else:
                    user_messages.append(msg)

            # Combiner tous les messages système et les tronquer
            system_prompt = "\n\n".join(system_messages) if system_messages else None
            if system_prompt:
                system_prompt = self._limit_content(
                    system_prompt, max_length=2000
                )  # Tronquer à 2000 chars

            # Filtrer les kwargs pour retirer temperature
            filtered_kwargs = {k: v for k, v in kwargs.items() if k != "temperature"}

            # Désactiver le streaming pour contrôler les tokens de sortie
            response = client.messages.create(
                messages=user_messages,
                system=system_prompt,  # Paramètre système séparé
                stream=False,  # Désactiver le streaming
                timeout=30,  # 30 secondes de timeout (optimisé)
                **filtered_kwargs,
            )

            # Récupérer le contenu directement (peut être vide si refus / filtre)
            content = (
                response.content[0].text
                if response.content and len(response.content) > 0
                else None
            )

            duration = time.time() - start_time

            self.api_logger.log_model_call(
                model_name=kwargs.get("model", "unknown"),
                provider="anthropic",
                duration=duration,
            )

            return content or ""

        except Exception as e:
            duration = time.time() - start_time
            self.api_logger.log_error(e, "anthropic_model_call", duration)
            raise


# Instance du contrôleur
anthropic_controller = AnthropicController()
router = anthropic_controller.router
