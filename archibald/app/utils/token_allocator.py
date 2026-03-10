from typing import Dict, Set


class TokenAllocator:
    PLACEHOLDERS: Set[str] = {
        "{modelPrompt}",
        "{question}",
        "{lastExchange}",
        "{rag}",
        "{temporaryDocumentContext}",
        "{webSearch}",
        "{crlf}",
    }

    NON_TRUNCATABLE_KEYS: Set[str] = {"model_prompt", "question", "system_prompt"}

    COMPONENT_WEIGHTS: Dict[str, int] = {
        "model_prompt": 10,
        "last_exchange": 10,
        "rag": 6,
        "temporary_document_content": 8,
        "web_search_result": 7,
        "question": 10,
        "system_prompt": 10,
    }

    def __init__(
        self,
        model_prompt: str,
        last_exchange: str,
        rag: str,
        temporary_document_content: str,
        web_search_result: str,
        question: str,
        model_name: str,
        system_prompt_template: str,
        max_input_tokens: int,
        provider: str,
        reserve_tokens: int,
    ):
        self.model_prompt = model_prompt
        self.last_exchange = last_exchange
        self.rag = rag
        self.temporary_document_content = temporary_document_content
        self.web_search_result = web_search_result
        self.question = question
        self.model_name = model_name
        self.system_prompt_template = system_prompt_template
        self.max_input_tokens = max_input_tokens
        self.provider = provider
        self.reserve_tokens = reserve_tokens

    def _calculate_token_length(self, text: str) -> int:
        """
        Calcule le nombre de tokens dans un texte.
        Pour les modèles non-OpenAI, utilise une approximation basée sur le nombre de caractères.
        """
        if not text:
            return 0

        # Pour les modèles non-OpenAI, on utilise une approximation (4 caractères = 1 token)
        return len(text) // 4

    def allocate_tokens(self) -> Dict[str, str]:
        components = {
            "system_prompt": self.system_prompt_template,
            "model_prompt": self.model_prompt,
            "last_exchange": self.last_exchange,
            "question": self.question,
        }

        if self.temporary_document_content:
            components["temporary_document_content"] = self.temporary_document_content
        if self.web_search_result:
            components["web_search_result"] = self.web_search_result

        token_counts = {}
        total_tokens = 0

        for key, content in components.items():
            length = self._calculate_token_length(content)
            token_counts[key] = length
            total_tokens += length

        available_tokens = self.max_input_tokens - self.reserve_tokens

        if total_tokens > available_tokens:
            ratio = available_tokens / total_tokens
            for key in token_counts:
                if key not in self.NON_TRUNCATABLE_KEYS:
                    token_counts[key] = int(token_counts[key] * ratio)

        result = {k: getattr(self, k) for k in components.keys()}
        result.update(
            {
                "total_tokens": total_tokens,
                "available_tokens": available_tokens,
            }
        )

        return result
