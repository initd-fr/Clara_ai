# Clara AI — Assistant IA (app locale)

<p align="center">
  <img src="clara-ai/public/LogoClara_Dark.webp" alt="Clara AI" width="200" />
</p>

[![License](https://img.shields.io/badge/License-Attribution%2BContact-blue.svg)](LICENSE)

**Clara AI** est une plateforme web d’assistant conversationnel IA :

- **Clara** (`clara-ai/`) : application Next.js (frontend + API tRPC), authentification, gestion des conversations et des modèles personnels, base PostgreSQL (Prisma), stockage MinIO. Le chat et le RAG sont délégués au moteur Archibald.
- **Archibald** (`archibald/`) : API FastAPI (Python) qui centralise les appels LLM (OpenAI, Mistral, Anthropic, Google), le RAG (pgvector), le traitement de documents et la recherche web (Tavily). Clara s’y connecte via `ARCHIBALD_API_URL` et `ARCHIBALD_API_KEY`.

**Fonctionnement** : application **100 % locale**. Pas d'abonnements, pas de limites, pas de paiement.

Un seul fichier `.env` à la racine (partagé Clara + Archibald). Schéma des données : `clara-ai/prisma/schema.prisma`. Annexes : [clara-ai/README.md](clara-ai/README.md), [archibald/README.md](archibald/README.md).

---

## Prérequis (à installer sur votre machine)

| Outil | Utilisation | Installation |
| ----- | ----------- | ------------ |
| **Git** | Cloner le dépôt | [git-scm.com](https://git-scm.com/) |
| **Node.js 18+** | Clara (frontend + API) | [nodejs.org](https://nodejs.org/) ou `brew install node` |
| **pnpm** | Gestion des paquets Node | `npm install -g pnpm` |
| **Python 3.12+** | Archibald (moteur IA) | [python.org](https://www.python.org/downloads/) ou `brew install python@3.12` |
| **uv** | Gestion des paquets Python | `curl -LsSf https://astral.sh/uv/install.sh \| sh` ou `pip install uv` |
| **Docker Desktop** | Mode production (ou Postgres + MinIO en dev) | [macOS](https://docs.docker.com/desktop/setup/install/mac-install/) · [Linux](https://docs.docker.com/desktop/setup/install/linux/) · [Windows](https://docs.docker.com/desktop/setup/install/windows-install/) |

Vérifier les installations :
```bash
node -v    # v18 ou plus
pnpm -v
python3 --version   # 3.12 ou plus
uv --version
```

---

## Mode développement (étape par étape)

Vous lancez Clara et Archibald **sur votre machine** ; PostgreSQL et MinIO peuvent tourner en Docker ou en local.

**Étape 1 — Cloner le dépôt**
```bash
git clone https://github.com/initd-fr/Clara_ai.git
cd Clara_ai
```

**Étape 2 — Fichier d’environnement**
```bash
cp .env.exemple .env
```
Ouvrir `.env` et renseigner au minimum :
- **Utilisateur par défaut** : `CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`
- **Base de données** : `DATABASE_URL` (ex. `postgresql://user:pass@localhost:5432/clara` si Postgres en local)
- **MinIO** : `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` (ou laisser les valeurs pour Docker)
- **Secrets** : `NEXTAUTH_SECRET`, `ARCHIBALD_API_KEY` et `API_KEY` (même valeur)
- **Optionnel** : clés API LLM (OpenAI, Mistral, Google) pour le chat

**Étape 3 — Démarrer PostgreSQL et MinIO (Docker)**  
Si vous n’avez pas Postgres/MinIO en local, dans un terminal à la racine du projet :
```bash
docker compose up -d postgres minio
```
Attendre quelques secondes que Postgres soit prêt.

**Étape 4 — Clara (Next.js)**
```bash
cd clara-ai
pnpm install
pnpm db:push
node src/scripts/createClaraUser.js
pnpm dev
```
Clara tourne sur **http://localhost:3000**. Laisser ce terminal ouvert.

**Étape 5 — Archibald (moteur IA)**  
Dans un **nouveau terminal**, à la racine du projet :
```bash
cd Clara_ai
uv sync
uv run --directory archibald uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Archibald tourne sur **http://localhost:8000**. Dans `.env`, mettre `ARCHIBALD_API_URL=http://localhost:8000` et `ARCHIBALD_API_KEY` (même valeur que `API_KEY`).

**Résumé** : Ouvrir http://localhost:3000, se connecter avec les identifiants du `.env`. Pour utiliser le chat, aller dans **Support → Providers / Models** et ajouter au moins un modèle.

---

## Mode production (étape par étape)

Toute la stack tourne dans **Docker** (PostgreSQL, MinIO, Clara, Archibald). Une seule commande après configuration.

**Étape 1 — Installer Docker Desktop**  
Télécharger et installer : [Docker Desktop](https://docs.docker.com/desktop/). L’ouvrir et attendre qu’il soit prêt.

**Étape 2 — Cloner le dépôt**
```bash
git clone https://github.com/initd-fr/Clara_ai.git
cd Clara_ai
```

**Étape 3 — Fichier d’environnement**
```bash
cp .env.exemple .env
```
Éditer `.env` et renseigner :
- **Utilisateur par défaut** : `CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`
- **Secrets** : `NEXTAUTH_SECRET`, `API_KEY`, `ARCHIBALD_API_KEY` (le script peut les générer automatiquement si vous lancez `./start.sh` ou `.\start.ps1` une première fois sans les remplir)
- **Optionnel** : clés API LLM pour le chat. Les hostnames `postgres` et `minio` dans le `.env` sont déjà adaptés à Docker.

**Étape 4 — Lancer la stack**

- **Linux / macOS :** `./start.sh`
- **Windows (PowerShell) :** `.\start.ps1`  
- **Windows (invite de commandes ou double-clic) :** `start.bat`

Le script construit les images, démarre PostgreSQL, MinIO, Clara et Archibald, applique le schéma en base et crée l’utilisateur par défaut.

**Étape 5 — Utiliser l’application**  
Ouvrir **http://localhost:3000** et se connecter avec les identifiants du `.env`.  
Configurer le chat : **Support** → onglet **Providers** (activer) → onglet **Models** (ajouter des modèles). Références : [OpenAI](https://developers.openai.com/api/docs/models/all), [Mistral](https://docs.mistral.ai/getting-started/models), [Google Gemini](https://ai.google.dev/gemini-api/docs/models?hl=fr).

**Arrêter la stack :** `docker compose down`  
**Voir les logs :** `docker compose logs -f`

**Recréer l’utilisateur par défaut :**  
`docker compose run --rm clara node src/scripts/createClaraUser.js`

*Sous Windows sans WSL : utiliser `.\start.ps1` ou `start.bat` (équivalent de `start.sh`). Si vous lancez Docker à la main : `docker compose up -d --build`, puis `docker compose run --rm clara pnpm db:push`, puis `docker compose run --rm clara node src/scripts/createClaraUser.js`.*

---

## Vue d’ensemble technique

| Composant      | Rôle                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Clara**      | SPA + API (Next.js 14, tRPC, Prisma, NextAuth, MinIO). Chat, auth, modèles personnels, support, cron. |
| **Archibald**  | API REST (FastAPI) : routes chat par provider/mode, RAG, documents, recherche web. Authentification par `X-API-Key`.       |
| **PostgreSQL** | Données Clara (Prisma), partagé avec Archibald pour le RAG. Extension **pgvector** requise pour les embeddings.            |
| **MinIO**      | Stockage S3-compatible (fichiers uploadés, documents).                                                                     |

Flux typique : l’utilisateur utilise l’UI Clara → requêtes tRPC → Prisma / MinIO ; le chat et le RAG sont envoyés à Archibald, qui lit/écrit en PostgreSQL et MinIO.

**En production (déploiement public)** : placer un reverse proxy (Nginx, Caddy, Traefik) devant Clara et Archibald, en HTTPS, et adapter `NEXTAUTH_URL` et `CORS_ORIGINS` dans `.env`.

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
