# Clara AI — Assistant IA (app locale)

<p align="center">
  <img src="clara-ai/public/LogoClara_Dark.webp" alt="Clara AI" width="200" />
</p>

[![License](https://img.shields.io/badge/License-Attribution%2BContact-blue.svg)](LICENSE)

**Clara AI** est une plateforme web d’assistant conversationnel IA :

- **Clara** (`clara-ai/`) : application Next.js (frontend + API tRPC), authentification, gestion des conversations et des modèles personnels, base PostgreSQL (Prisma), stockage MinIO. Le chat et le RAG sont délégués au moteur Archibald.
- **Archibald** (`archibald/`) : API FastAPI (Python) qui centralise les appels LLM (OpenAI, Mistral, Anthropic, Google), le RAG (pgvector), le traitement de documents et la recherche web (Tavily). Clara s’y connecte via `ARCHIBALD_API_URL` et `ARCHIBALD_API_KEY`.

**Fonctionnement** : application **100 % locale**. Pas d'abonnements, pas de limites, pas de paiement.

Un seul `.env` à la racine (voir `.env.exemple`), puis `./start.sh`. Schéma des données : `clara-ai/prisma/schema.prisma`. Annexes : [clara-ai/README.md](clara-ai/README.md), [archibald/README.md](archibald/README.md).

---

## Tester rapidement (Docker)

**Prérequis :** **Docker Desktop** doit être installé sur votre machine avant de lancer le script. Liens d'installation officiels :

- **macOS** : [Installer Docker Desktop sur Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
- **Linux** : [Installer Docker Desktop sur Linux](https://docs.docker.com/desktop/setup/install/linux/)
- **Windows** : [Installer Docker Desktop sur Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Un seul fichier d’environnement à la racine, partagé par Clara et Archibald :

1. **Copier le fichier d’exemple**  
   `cp .env.exemple .env`

2. **Remplir** le `.env` : secrets (NEXTAUTH_SECRET, API_KEY sont générés automatiquement si besoin), **utilisateur par défaut** (`CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`) et, optionnel, les clés API LLM pour le chat.

3. **Lancer le script**  
   `./start.sh`

La stack démarre (PostgreSQL, MinIO, Clara, Archibald), le schéma de base est appliqué et un **utilisateur par défaut** est créé avec les identifiants définis dans le `.env`. Ouvrez **http://localhost:3000** — Clara tourne en prod.

Les identifiants du compte par défaut sont ceux du `.env` (CLARA_DEFAULT_EMAIL, CLARA_DEFAULT_PASSWORD, etc.). Vous pouvez vous connecter avec ces identifiants ou créer un nouveau compte via l’inscription.

**Mot de passe oublié / réinitialisation**  
Cette version tourne en local : il n’y a pas de « mot de passe oublié » par email. Pour réinitialiser ou recréer un compte, exécutez le script **createClaraUser** à la main (après `db:push`) :  
`docker compose run --rm clara node src/scripts/createClaraUser.js`  
Le script utilise les variables `CLARA_DEFAULT_*` du `.env` ; vous pouvez modifier l’email dans le script pour cibler un autre utilisateur.

**Configurer le chat (providers et modèles)**  
Au premier lancement, le script crée les **3 providers** par défaut (OpenAI, Mistral, Google). Pour pouvoir envoyer des messages :

1. Connectez-vous avec le compte par défaut (admin).
2. Allez sur **http://localhost:3000/support**.
3. **Onglet « Providers »** : les 3 providers (OpenAI, Mistral, Google) sont déjà présents ; vous pouvez les activer/désactiver.
4. **Onglet « Models »** : ajoutez les modèles que vous voulez utiliser (ex. GPT-4o, Mistral Small, Gemini 2.5 Flash). Les identifiants de modèles se trouvent dans les docs officielles :
   - [OpenAI — Tous les modèles](https://developers.openai.com/api/docs/models/all)
   - [Mistral — Modèles](https://docs.mistral.ai/getting-started/models)
   - [Google Gemini — Modèles](https://ai.google.dev/gemini-api/docs/models?hl=fr)

Une fois au moins un modèle ajouté par provider souhaité, le chat est utilisable.

- Arrêter : `docker compose down`
- Logs : `docker compose logs -f`

_Sous Windows (sans WSL) : copier `.env.exemple` en `.env`, puis `docker compose up -d --build`, puis `docker compose run --rm clara pnpm db:push`, puis `docker compose run --rm clara node src/scripts/createClaraUser.js` pour créer l’utilisateur Clara._

---

## Vue d’ensemble technique

| Composant      | Rôle                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Clara**      | SPA + API (Next.js 14, tRPC, Prisma, NextAuth, MinIO). Chat, auth, modèles personnels, support, cron. |
| **Archibald**  | API REST (FastAPI) : routes chat par provider/mode, RAG, documents, recherche web. Authentification par `X-API-Key`.       |
| **PostgreSQL** | Données Clara (Prisma), partagé avec Archibald pour le RAG. Extension **pgvector** requise pour les embeddings.            |
| **MinIO**      | Stockage S3-compatible (fichiers uploadés, documents).                                                                     |

Flux typique : l’utilisateur utilise l’UI Clara → requêtes tRPC → Prisma / MinIO ; le chat et le RAG sont envoyés à Archibald, qui lit/écrit en PostgreSQL et MinIO.

---

## Prérequis

- **Clara** : Node.js 18+, pnpm, PostgreSQL (avec `vector`), MinIO.
- **Archibald** : Python 3.12+, uv, PostgreSQL (pgvector), MinIO.
- **Un seul `.env`** à la racine (partagé Clara + Archibald). **Un seul `.venv`** à la racine (Python / uv).
- **Production** : Docker et Docker Compose (voir plus bas).

---

## Installation en développement

### 1. Cloner et préparer l’environnement

```bash
git clone https://github.com/VOTRE_USERNAME/clara-ai.git
cd clara-ai
cp .env.exemple .env
# Éditer .env (racine) : DATABASE_URL, MINIO_*, NEXTAUTH_*, clés API LLM, ARCHIBALD_*, etc.
```

Clara et Archibald chargent automatiquement le `.env` à la racine (pas de `.env` dans `clara-ai/` ni `archibald/`).

### 2. Lancer Clara

PostgreSQL et MinIO doivent être accessibles (local ou Docker).

```bash
cd clara-ai
pnpm install
pnpm db:push
pnpm dev
```

(Next.js + WebSocket sur 3000 et 3001.) Détails : [clara-ai/README.md](clara-ai/README.md).

### 3. Lancer Archibald (moteur IA déporté, uniquement en dev sans Docker)

_Ne s'applique pas si vous utilisez `./start.sh` (Docker) : les services démarrent ensemble._

Un seul `.venv` à la racine (workspace uv) :

```bash
# À la racine du dépôt
uv sync
uv run --directory archibald uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API sur **http://localhost:8000**. Dans `.env` : `ARCHIBALD_API_URL=http://localhost:8000` et `ARCHIBALD_API_KEY` (même valeur que `API_KEY`). Détails : [archibald/README.md](archibald/README.md).

---

## Installation sur son serveur (production)

Même principe que « Tester rapidement » : **un seul `.env` à la racine**, puis le script.

1. À la racine : `cp .env.exemple .env`
2. Éditer `.env` : secrets, clés API, URLs de prod, et **utilisateur par défaut** (`CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`). Les valeurs par défaut (postgres, minio comme hostnames) sont prévues pour Docker.
3. `./start.sh` — Clara et Archibald tournent en prod ; un utilisateur par défaut est créé avec les identifiants renseignés dans le `.env`.

Pour un déploiement public, placer un reverse proxy (Nginx, Caddy, Traefik) devant Clara et Archibald, en HTTPS, et adapter `NEXTAUTH_URL` et `CORS_ORIGINS` dans `.env`.

---

## Stack technique (résumé)

| Domaine       | Clara (Next.js)                                       | Archibald (Python)                             |
| ------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Framework     | Next.js 14, React 18, TypeScript                      | FastAPI, Python 3.12+                          |
| API / données | tRPC, Prisma, PostgreSQL, SuperJSON                   | REST, SQLAlchemy/Prisma, PostgreSQL (pgvector) |
| Auth          | NextAuth (Credentials + Google), JWT                  | X-API-Key                                      |
| IA / RAG      | LangChain, embeddings, pgvector (délégué à Archibald) | LangChain, vectorstores, Tavily                |
| Stockage      | MinIO (S3)                                            | MinIO                                          |
| Qualité       | Zod, Vitest, Playwright                               | Pydantic, Ruff, mypy, pytest                   |

---

## Licence

Ce projet est librement **consultable et utilisable** ; une **attribution** est requise. Pour un **usage commercial** ou la **distribution d’un produit basé sur ce code**, merci de **contacter l’auteur**. Voir [LICENSE](LICENSE).
