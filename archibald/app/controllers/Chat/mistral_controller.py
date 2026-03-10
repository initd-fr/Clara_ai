##
# ~ IMPORTS
import os
import time
from typing import Any, Dict, List

from fastapi import APIRouter
from mistralai import Mistral

from app.core.base_controller import BaseChatController
from app.core.logging_config import APILogger

# ~ IMPORTS LANGCHAIN
# ? #######################################/ TYPES/ ###########################################/
from app.Types.types import ChatResponse

# ~ IMPORTS FONCTIONS

# ? #######################################/ TYPES/ ###########################################/


class MistralController(BaseChatController):
    """Contrôleur Mistral optimisé héritant de BaseChatController"""

    def __init__(self):
        router = APIRouter(prefix="/mistral", tags=["mistral"])
        super().__init__(router)
        self.api_logger = APILogger("mistral")

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
        """Retourne le client Mistral avec cache"""
        cache_key = f"{model_name}"

        if cache_key in self.client_cache:
            return self.client_cache[cache_key]

        client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
        self.client_cache[cache_key] = client
        return client

    def prepare_messages(
        self, messages: List[Dict[str, str]], image_content: str = None
    ) -> List[Dict[str, Any]]:
        """Prépare les messages pour l'API Mistral"""
        prepared_messages = []

        for msg in messages:
            if msg["role"] == "user" and image_content:
                # Format Mistral pour les images
                prepared_messages.append(
                    {
                        "role": "user",
                        "content": msg["content"],
                        "images": [image_content],
                    }
                )
            else:
                prepared_messages.append(msg)

        return prepared_messages

    async def invoke_model(self, client, messages, **kwargs) -> str:
        """Appelle le modèle Mistral avec la nouvelle API"""
        start_time = time.time()

        try:
            model = kwargs.get("model", "mistral-small-latest")
            max_tokens = kwargs.get("max_tokens", 4000)
            temperature = kwargs.get("temperature", 0.7)

            response = client.chat.complete(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            content = response.choices[0].message.content
            duration = time.time() - start_time

            self.api_logger.log_model_call(
                model_name=model,
                provider="mistral",
                duration=duration,
            )

            return content or ""

        except Exception as e:
            duration = time.time() - start_time
            self.api_logger.log_error(e, "mistral_model_call", duration)
            raise


# Instance du contrôleur
mistral_controller = MistralController()
router = mistral_controller.router
