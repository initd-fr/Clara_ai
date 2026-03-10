"""Tests de l'authentification par clé API."""
import pytest


def test_protected_route_without_key_returns_401(client):
    """Une route protégée sans X-API-Key doit retourner 401."""
    response = client.get("/openai/chat")
    assert response.status_code == 401
    assert response.json().get("detail") == "Invalid API Key"


def test_protected_route_with_wrong_key_returns_401(client):
    """Une route protégée avec une mauvaise clé doit retourner 401."""
    response = client.get("/openai/chat", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401


def test_protected_route_with_valid_key_not_401(client, auth_headers):
    """Avec clé valide, on ne doit pas avoir 401 (peut être 405, 422, etc.)."""
    response = client.get("/openai/chat", headers=auth_headers)
    assert response.status_code != 401
