"""Tests généraux de l'application."""
import pytest


def test_app_title(client):
    """L'API expose le titre attendu dans OpenAPI."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data.get("info", {}).get("title") == "Archibald Engine"
    assert data.get("info", {}).get("version") == "1.0.0"


def test_health_endpoint_exists(client):
    """Le schéma OpenAPI contient la route /health."""
    response = client.get("/openapi.json")
    data = response.json()
    paths = data.get("paths", {})
    assert "/health" in paths
    assert "get" in paths["/health"]
