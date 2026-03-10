"""Tests OpenAPI et routes documentées."""

import json


def test_openapi_json_returns_200_without_auth(client):
    """GET /openapi.json sans clé doit retourner 200."""
    response = client.get("/openapi.json")
    assert response.status_code == 200


def test_openapi_json_valid(client):
    """Le contenu de /openapi.json est du JSON valide avec info."""
    response = client.get("/openapi.json")
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "Archibald Engine"
    assert "paths" in data


def test_openapi_paths_include_health_and_chat(client):
    """Les paths OpenAPI contiennent /health et les routes chat."""
    response = client.get("/openapi.json")
    paths = response.json().get("paths", {})
    assert "/health" in paths
    assert "get" in paths["/health"]
    assert "/openai/agent" in paths or "/openai/expert" in paths
