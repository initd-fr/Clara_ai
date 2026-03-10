"""Tests de validation des entrées (422, champs manquants, types)."""

import pytest


MINIMAL_PROMPT_VARIABLES = {
    "modelPrompt": "x",
    "lastExchange": "x",
    "temporaryDocumentContext": "",
    "webSearch": "",
    "question": "test",
    "crlf": "\n",
    "modelName": "test",
    "userName": "user",
}


def test_post_openai_agent_empty_body_returns_422(client, auth_headers):
    """POST /openai/agent sans body doit retourner 422."""
    response = client.post("/openai/agent", headers=auth_headers)
    assert response.status_code == 422


def test_post_openai_agent_invalid_body_returns_422(client, auth_headers):
    """POST /openai/agent avec body invalide doit retourner 422."""
    response = client.post(
        "/openai/agent",
        headers={**auth_headers, "Content-Type": "application/json"},
        json={"question": "test"},
    )
    assert response.status_code == 422


def test_post_openai_agent_wrong_type_model_id_returns_422(client, auth_headers):
    """modelId string au lieu d'int doit retourner 422."""
    response = client.post(
        "/openai/agent",
        headers={**auth_headers, "Content-Type": "application/json"},
        json={
            "question": "q",
            "provider": "openai",
            "ProviderModel": "gpt-4",
            "modelId": "not-an-int",
            "promptVariables": MINIMAL_PROMPT_VARIABLES,
            "userAccountType": "user",
        },
    )
    assert response.status_code == 422


def test_post_openai_agent_negative_model_id_returns_422(client, auth_headers):
    """modelId négatif doit retourner 422."""
    response = client.post(
        "/openai/agent",
        headers={**auth_headers, "Content-Type": "application/json"},
        json={
            "question": "q",
            "provider": "openai",
            "ProviderModel": "gpt-4",
            "modelId": -1,
            "promptVariables": MINIMAL_PROMPT_VARIABLES,
            "userAccountType": "user",
        },
    )
    assert response.status_code == 422


def test_post_openai_expert_empty_body_returns_422(client, auth_headers):
    """POST /openai/expert sans body doit retourner 422."""
    response = client.post("/openai/expert", headers=auth_headers)
    assert response.status_code == 422
