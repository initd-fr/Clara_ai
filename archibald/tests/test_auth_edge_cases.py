"""Tests auth : clé vide, absente, caractères spéciaux."""

import pytest


def test_protected_route_empty_api_key_returns_401(client):
    """X-API-Key vide doit donner 401."""
    response = client.get("/openai/agent", headers={"X-API-Key": ""})
    assert response.status_code == 401


def test_protected_route_special_chars_key_returns_401(client):
    """X-API-Key invalide avec caractères spéciaux doit donner 401."""
    response = client.get(
        "/openai/agent",
        headers={"X-API-Key": "invalid<>key'\""},
    )
    assert response.status_code == 401


def test_health_without_key_returns_200(client):
    """GET /health sans clé doit rester 200 (endpoint public)."""
    response = client.get("/health")
    assert response.status_code == 200
