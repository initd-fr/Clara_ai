##
# ~ IMPORTS
import os
import time
from typing import Any, Dict, List

import google.generativeai as genai
from fastapi import APIRouter

from app.core.base_controller import BaseChatController
from app.core.logging_config import APILogger

# ~ IMPORTS LANGCHAIN
# ? #######################################/ TYPES/ ###########################################/
from app.Types.types import ChatResponse

# ~ IMPORTS FONCTIONS

# ? #######################################/ TYPES/ ###########################################/


class GoogleController(BaseChatController):
    """Contrôleur Google optimisé héritant de BaseChatController"""

    def __init__(self):
        router = APIRouter(prefix="/google", tags=["google"])
        super().__init__(router)
        self.api_logger = APILogger("google")

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
        """Retourne le client Google avec cache"""
        cache_key = f"{model_name}"

        if cache_key in self.client_cache:
            return self.client_cache[cache_key]

        # Configuration de l'API Google
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel(model_name)
        self.client_cache[cache_key] = model
        return model

    def prepare_messages(
        self, messages: List[Dict[str, str]], image_content: str = None
    ) -> List[Dict[str, Any]]:
        """Prépare les messages pour l'API Google"""
        # Google Gemini utilise un format spécifique pour les messages
        prepared_messages = []

        for msg in messages:
            if msg["role"] == "user" and image_content:
                # Format Google pour les images avec base64
                prepared_messages.append(
                    {
                        "role": "user",
                        "parts": [
                            {"text": msg["content"]},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_content,
                                },
                            },
                        ],
                    }
                )
            elif msg["role"] == "user":
                # Message utilisateur texte seulement
                prepared_messages.append(
                    {
                        "role": "user",
                        "parts": [{"text": msg["content"]}],
                    }
                )
            elif msg["role"] == "system":
                # Messages système - Google les traite comme des messages utilisateur
                # car Gemini ne supporte pas les messages système
                prepared_messages.append(
                    {
                        "role": "user",
                        "parts": [{"text": f"Instructions système: {msg['content']}"}],
                    }
                )
            else:
                # Messages assistant
                prepared_messages.append(
                    {
                        "role": "model",
                        "parts": [{"text": msg["content"]}],
                    }
                )

        return prepared_messages

    async def invoke_model(self, client, messages, **kwargs) -> str:
        """Appelle le modèle Google"""
        start_time = time.time()

        try:
            # Créer une conversation avec l'historique
            chat = client.start_chat(history=[])

            # Envoyer tous les messages dans l'ordre
            for message in messages:
                if message["role"] == "user":
                    if (
                        len(message["parts"]) > 1
                        and "inline_data" in message["parts"][1]
                    ):
                        # Message avec image
                        response = chat.send_message(
                            [
                                message["parts"][0]["text"],
                                message["parts"][1]["inline_data"],
                            ],
                            generation_config=genai.types.GenerationConfig(
                                max_output_tokens=kwargs.get("max_tokens", 2048),
                            ),
                        )
                    else:
                        # Message texte seulement
                        response = chat.send_message(
                            message["parts"][0]["text"],
                            generation_config=genai.types.GenerationConfig(
                                max_output_tokens=kwargs.get("max_tokens", 2048),
                            ),
                        )
                elif message["role"] == "model":
                    # Message assistant - ajouter à l'historique
                    chat.history.append(
                        {
                            "role": "model",
                            "parts": [{"text": message["parts"][0]["text"]}],
                        }
                    )

            # Récupérer la dernière réponse (peut être vide)
            content = response.text if response else None
            duration = time.time() - start_time

            self.api_logger.log_model_call(
                model_name=kwargs.get("model", "unknown"),
                provider="google",
                duration=duration,
            )

            return content or ""

        except Exception as e:
            duration = time.time() - start_time
            self.api_logger.log_error(e, "google_model_call", duration)
            raise


# Instance du contrôleur
google_controller = GoogleController()
router = google_controller.router
