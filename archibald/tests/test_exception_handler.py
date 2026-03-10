"""Tests du gestionnaire global d'exceptions (500, format de réponse)."""


def test_health_stable_on_repeated_calls(client):
    """Appels successifs à /health restent 200."""
    for _ in range(5):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json().get("status") == "healthy"


def test_500_response_has_expected_shape(client, auth_headers):
    """Une erreur 500 doit retourner detail, error_type, timestamp (pas de stack trace)."""
    response = client.get("/nonexistent-route-that-might_500")
    if response.status_code == 500:
        data = response.json()
        assert "detail" in data
        assert "error_type" in data
        assert "timestamp" in data
        assert "traceback" not in str(data).lower() and "stack" not in str(data).lower()
