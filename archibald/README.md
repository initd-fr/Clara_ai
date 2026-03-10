# Archibald — Moteur IA (FastAPI)

Ce dossier contient **Archibald** : API moteur IA (FastAPI, Python) du projet [Clara AI](../README.md). Il centralise les appels LLM multi-providers, le RAG, le traitement de documents et la recherche web. L’application **Clara** (Next.js) peut l’appeler pour déléguer tout ou partie de la logique IA.

---

## Rôle de ce module

- **LLM** : OpenAI, Mistral, Anthropic, Google (Gemini) — modes agent et expert
- **RAG** : recherche vectorielle (PostgreSQL + pgvector), injection de contexte dans les prompts
- **Documents** : PDF, DOCX, XLSX, CSV, TXT, images
- **Recherche web** : Tavily (et optionnellement Google / Serper)

Voir le [README racine](../README.md) pour l’architecture globale et les technologies.

---

## Prérequis

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (gestion des dépendances)
- PostgreSQL avec extension **pgvector**
- MinIO (stockage objets)

---

## Installation

Le projet utilise **un seul `.env` et un seul `.venv` à la racine**. Archibald charge le `.env` racine automatiquement. Voir le [README racine](../README.md).

1. **À la racine** : `cp .env.exemple .env` puis éditer `.env`.
2. **Environnement Python** (un seul `.venv` à la racine) :

   ```bash
   # À la racine du dépôt
   uv sync
   ```

3. **PostgreSQL et MinIO** accessibles (avec pgvector pour la base).

4. **Lancement** (depuis la racine) :
   ```bash
   uv run --directory archibald uvicorn app.main:app --reload
   ```
   API disponible sur `http://127.0.0.1:8000`.

---

## Vérification

- **Santé** (sans auth) : `curl http://127.0.0.1:8000/health`
- **Avec clé API** : `curl -H "X-API-Key: VOTRE_CLE" http://127.0.0.1:8000/health`

Documentation interactive : **Swagger** `/docs`, **ReDoc** `/redoc` (souvent en dev uniquement).

---

## Authentification

Toutes les routes (sauf `/health`, `/docs`, `/redoc`, `/openapi.json`) exigent le header :

```
X-API-Key: <votre API_KEY>
```

CORS : origines autorisées via `CORS_ORIGINS` dans `.env` (ex. `http://localhost:3000` pour Clara).

---

## Fonctionnalités API

- **Chat** par fournisseur et mode :
  - OpenAI : `/openai/agent`, `/openai/expert`
  - Mistral : `/mistral/agent`, `/mistral/expert`
  - Anthropic : `/anthropic/agent`, `/anthropic/expert`
  - Google : `/google/agent`, `/google/expert`
- **RAG** : enrichissement des prompts avec documents indexés et recherche web (Tavily)
- **Formats** : PDF, DOCX, XLSX, CSV, TXT, images

---

## Tests

À la racine (avec le `.venv` unifié) :

```bash
uv sync --extra dev
uv run --directory archibald python -m pytest tests/ -v
```

Un rapport d’audit de sécurité peut être disponible dans `docs/SECURITY_AUDIT.md`.

---

## Licence

La licence du projet est définie à la **racine du dépôt** : [../LICENSE](../LICENSE).
