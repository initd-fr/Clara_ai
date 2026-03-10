# ~ IMPORTS
# ruff: noqa: N815 — camelCase volontaire pour le contrat JSON (API / frontend)
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ? TYPES
class Document(BaseModel):
    content: str = Field(..., max_length=5_000_000)
    title: str = Field(..., max_length=2_000)
    mimeType: Literal[
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/rtf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ]


class DocumentResponse(BaseModel):
    title: str = Field(..., max_length=2_000)
    content: str = Field(..., max_length=5_000_000)
    url: Optional[str] = Field(None, max_length=2_000)


class PromptVariables(BaseModel):
    modelPrompt: str = Field(..., max_length=100_000)
    lastExchange: str = Field(..., max_length=100_000)
    temporaryDocumentContext: str = Field(..., max_length=500_000)
    webSearch: str = Field(..., max_length=200_000)
    question: str = Field(..., max_length=50_000)
    crlf: str = Field(..., max_length=10)
    modelName: str = Field(..., max_length=200)
    userName: str = Field(..., max_length=500)


class ChatRequest(BaseModel):
    question: str = Field(..., max_length=50_000)
    provider: str = Field(..., max_length=50)
    ProviderModel: str = Field(..., max_length=200)
    modelId: int = Field(..., ge=0)
    document: Optional[Document] = None
    systemPrompt: Optional[str] = Field(None, max_length=100_000)
    userPrompt: Optional[str] = Field(None, max_length=50_000)
    image: Optional[str] = Field(None, max_length=20_000_000)
    maxInputTokens: Optional[int] = Field(None, ge=1, le=1_000_000)
    maxOutputTokens: Optional[int] = Field(None, ge=1, le=100_000)
    promptVariables: PromptVariables
    url: Optional[str] = Field(None, max_length=2_000)
    userAccountType: str = Field(..., max_length=50)


class ChatResponse(BaseModel):
    answer: str = Field(..., max_length=1_000_000)
    document: Optional[DocumentResponse] = None
    documents: Optional[list] = None
