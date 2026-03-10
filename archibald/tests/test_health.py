"""Tests du endpoint /health."""
import pytest


def test_health_returns_200(client):
    """GET /health sans clé API doit retourner 200 (endpoint public)."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_shape(client):
    """La réponse /health contient status, timestamp et api."""
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "api" in data
    assert "Archibald Engine" in data["api"]


def test_health_with_api_key(client, auth_headers):
    """GET /health avec clé API valide retourne 200."""
    response = client.get("/health", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
