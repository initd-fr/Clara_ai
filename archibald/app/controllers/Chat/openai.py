##
# ~ IMPORTS
import os
import time
from typing import Any, Dict, List

from fastapi import APIRouter
from openai import OpenAI

# ~ IMPORTS FONCTIONS
from app.core.base_controller import BaseChatController
from app.core.logging_config import APILogger

# ? TYPES
from app.Types.types import ChatResponse


class OpenAIController(BaseChatController):
    """Contrôleur OpenAI optimisé héritant de BaseChatController"""

    def __init__(self):
        router = APIRouter(prefix="/openai", tags=["openai"])
        super().__init__(router)
        self.api_logger = APILogger("openai")

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
        """Retourne le client OpenAI avec cache"""
        cache_key = f"{model_name}"

        if cache_key in self.client_cache:
            return self.client_cache[cache_key]

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.client_cache[cache_key] = client
        return client

    def prepare_messages(
        self, messages: List[Dict[str, str]], image_content: str = None
    ) -> List[Dict[str, Any]]:
        """Prépare les messages pour l'API OpenAI"""
        prepared_messages = []

        for msg in messages:
            if msg["role"] == "user" and image_content:
                # Format OpenAI pour les images
                prepared_messages.append(
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": msg["content"]},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                )
            else:
                prepared_messages.append(msg)

        return prepared_messages

    async def invoke_model(self, client, messages, **kwargs) -> str:
        """Appelle le modèle OpenAI"""
        start_time = time.time()

        try:
            filtered_kwargs = {k: v for k, v in kwargs.items() if k != "temperature"}
            if "max_tokens" in filtered_kwargs:
                filtered_kwargs["max_completion_tokens"] = filtered_kwargs.pop(
                    "max_tokens"
                )
            response = client.chat.completions.create(
                messages=messages, **filtered_kwargs
            )

            content = response.choices[0].message.content
            duration = time.time() - start_time

            self.api_logger.log_model_call(
                model_name=kwargs.get("model", "unknown"),
                provider="openai",
                duration=duration,
            )

            return content or ""

        except Exception as e:
            duration = time.time() - start_time
            self.api_logger.log_error(e, "openai_model_call", duration)
            raise


# Instance du contrôleur
openai_controller = OpenAIController()
router = openai_controller.router
