# Clara AI — AI Assistant (local app)

## TL;DR

Clara AI is a local AI assistant platform built around a RAG architecture.

- Next.js frontend (chat interface, user system)
- FastAPI backend (LLM orchestration, RAG engine)
- PostgreSQL + pgvector
- Multi-provider LLM support (OpenAI, Mistral, Anthropic, Gemini)

-> Focus: building a structured, production-ready AI backend with a strong Python architecture.

<p align="center">
  <img src="clara-ai/public/LogoClara_Dark.webp" alt="Clara AI" width="200" />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Clara AI** is a web platform for conversational AI assistance:

- **Clara** (`clara-ai/`): Next.js application (frontend + tRPC API), authentication, conversation and custom model management, PostgreSQL database (Prisma), and MinIO storage. Chat and RAG are delegated to the Archibald engine.
- **Archibald** (`archibald/`): FastAPI (Python) API that centralizes LLM calls (OpenAI, Mistral, Anthropic, Google), RAG (pgvector), document processing, and web search (Tavily). Clara connects to it through `ARCHIBALD_API_URL` and `ARCHIBALD_API_KEY`.

## Technical Focus

This project focuses on:

- Python backend development with FastAPI (Archibald)
- RAG pipeline implementation (pgvector + embeddings)
- LLM orchestration across multiple providers
- Integration between frontend and AI backend systems

The goal is to build a scalable and maintainable AI backend architecture.

## RAG Workflow

1. User input

- The user sends a message from the frontend (Clara)

2. Request routing

- The request is sent to the FastAPI backend (Archibald)

3. Document retrieval

- Relevant documents are retrieved from PostgreSQL using pgvector similarity search

4. Context building

- Retrieved documents are injected into the prompt as context

5. LLM processing

- The request is sent to the selected provider (OpenAI, Mistral, Anthropic, etc.)

6. Response generation

- The model generates a response using both the user input and retrieved context

7. Response return

- The response is sent back to Clara and displayed to the user

Optional (present in the codebase):

- Web search integration via Tavily
- Agent / expert modes in backend routes

**How it works**: an application hosted locally, with dependencies on external APIs for AI models and web search. No subscriptions or payments; no artificial limitations imposed by the application itself.

A single `.env` file at the repository root (shared by Clara + Archibald). Data schema: `clara-ai/prisma/schema.prisma`. Additional docs: [clara-ai/README.md](clara-ai/README.md), [archibald/README.md](archibald/README.md).

---

## Prerequisites (install on your machine)

| Tool                               | Usage                                        | Installation                                                                                                                                                                                                    |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Git**                            | Clone the repository                         | [git-scm.com](https://git-scm.com/)                                                                                                                                                                             |
| **Node.js 18+**                    | Clara (frontend + API)                       | [nodejs.org](https://nodejs.org/) or `brew install node`                                                                                                                                                        |
| **pnpm**                           | Node package manager                         | `npm install -g pnpm`                                                                                                                                                                                           |
| **Python 3.9+ (3.12 recommended)** | Archibald (AI engine)                        | [python.org](https://www.python.org/downloads/) or `brew install python@3.12`                                                                                                                                   |
| **uv**                             | Python package manager                       | `curl -LsSf https://astral.sh/uv/install.sh \| sh` or `pip install uv`                                                                                                                                          |
| **Docker Desktop**                 | Production mode (or Postgres + MinIO in dev) | [macOS](https://docs.docker.com/desktop/setup/install/mac-install/) · [Linux](https://docs.docker.com/desktop/setup/install/linux/) · [Windows](https://docs.docker.com/desktop/setup/install/windows-install/) |

Check installations:

```bash
node -v    # v18 or later
pnpm -v
python3 --version   # 3.9 or later (3.12 recommended)
uv --version
```

---

## Current Capabilities

- Multi-provider chat (OpenAI, Mistral, Anthropic, Gemini)
- RAG system with PostgreSQL + pgvector
- Document ingestion and retrieval
- Web search integration (Tavily)
- User system and conversation management
- API-based architecture between frontend and AI backend

## Quick Start (Docker)

```bash
git clone https://github.com/initd-fr/Clara_ai.git
cd Clara_ai
cp .env.exemple .env
./start.sh
```

Open http://localhost:3000

---

## Development mode (step by step)

You run Clara and Archibald **on your machine**; PostgreSQL and MinIO can run in Docker or locally.

**Step 1 — Clone the repository**

```bash
git clone https://github.com/initd-fr/Clara_ai.git
cd Clara_ai
```

**Step 2 — Environment file**

```bash
cp .env.exemple .env
```

Open `.env` and fill in at minimum:

### Minimum required

- `DATABASE_URL`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `API_KEY`
- `ARCHIBALD_API_URL`
- `ARCHIBALD_API_KEY`

### Optional (AI features)

- `OPENAI_API_KEY`
- `MISTRAL_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `TAVILY_API_KEY`

These are required only if you want to enable specific AI providers or features.

- **Default user**: `CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`
- **Clara secret (recommended)**: `NEXTAUTH_SECRET`

**Step 3 — Start PostgreSQL and MinIO (Docker)**  
If you do not have Postgres/MinIO locally, run in a terminal at the project root:

```bash
docker compose up -d postgres minio
```

Wait a few seconds until Postgres is ready.

**Step 4 — Clara (Next.js)**

```bash
cd clara-ai
pnpm install
pnpm db:push
node src/scripts/createClaraUser.js
pnpm dev
```

Clara runs on **http://localhost:3000**. Keep this terminal open.

**Step 5 — Archibald (AI engine)**  
In a **new terminal**, at the project root:

```bash
cd Clara_ai
uv sync
uv run --directory archibald uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Archibald runs on **http://localhost:8000**. In `.env`, set `ARCHIBALD_API_URL=http://localhost:8000` and `ARCHIBALD_API_KEY` (same value as `API_KEY`).

**Summary**: Open http://localhost:3000 and sign in with the credentials from `.env`. To use chat, go to **Support → Providers / Models** and add at least one model.

---

## Production mode (step by step)

The full stack runs in **Docker** (PostgreSQL, MinIO, Clara, Archibald). A single command after configuration.

**Step 1 — Install Docker Desktop**  
Download and install: [Docker Desktop](https://docs.docker.com/desktop/). Open it and wait until it is ready.

**Step 2 — Clone the repository**

```bash
git clone https://github.com/initd-fr/Clara_ai.git
cd Clara_ai
```

**Step 3 — Environment file**

```bash
cp .env.exemple .env
```

Edit `.env` and fill in:

- **Default user**: `CLARA_DEFAULT_EMAIL`, `CLARA_DEFAULT_PASSWORD`, `CLARA_DEFAULT_FIRST_NAME`, `CLARA_DEFAULT_LAST_NAME`
- **Secrets**: `NEXTAUTH_SECRET`, `API_KEY`, `ARCHIBALD_API_KEY` (the script can generate them automatically if you run `./start.sh` or `.\start.ps1` once before filling them manually)

### Minimum required

- `DATABASE_URL`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `API_KEY`
- `ARCHIBALD_API_URL`
- `ARCHIBALD_API_KEY`

### Optional (AI features)

- `OPENAI_API_KEY`
- `MISTRAL_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `TAVILY_API_KEY`

These are required only if you want to enable specific AI providers or features.

The `postgres` and `minio` hostnames in `.env` are already configured for Docker.

**Step 4 — Start the stack**

- **Linux / macOS :** `./start.sh`
- **Windows (PowerShell) :** `.\start.ps1`
- **Windows (Command Prompt or double-click):** `start.bat`

The script builds images, starts PostgreSQL, MinIO, Clara, and Archibald, applies the database schema, and creates the default user.

**Step 5 — Use the application**  
Open **http://localhost:3000** and sign in with the `.env` credentials.  
Configure chat: **Support** → **Providers** tab (enable) → **Models** tab (add models). References: [OpenAI](https://developers.openai.com/api/docs/models/all), [Mistral](https://docs.mistral.ai/getting-started/models), [Google Gemini](https://ai.google.dev/gemini-api/docs/models?hl=fr).

**Stop the stack:** `docker compose down`  
**View logs:** `docker compose logs -f`

**Recreate the default user:**  
`docker compose run --rm clara node src/scripts/createClaraUser.js`

_On Windows without WSL: use `.\start.ps1` or `start.bat` (equivalent to `start.sh`). If you start Docker manually: `docker compose up -d --build`, then `docker compose run --rm clara pnpm db:push`, then `docker compose run --rm clara node src/scripts/createClaraUser.js`._

---

## Technical overview

| Component      | Role                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Clara**      | SPA + API (Next.js 14, tRPC, Prisma, NextAuth, MinIO). Chat, auth, custom models, support, cron.              |
| **Archibald**  | REST API (FastAPI): chat routes by provider/mode, RAG, documents, web search. Authentication via `X-API-Key`. |
| **PostgreSQL** | Clara data (Prisma), shared with Archibald for RAG. **pgvector** extension required for embeddings.           |
| **MinIO**      | S3-compatible storage (uploaded files, documents).                                                            |

Typical flow: the user interacts with the Clara UI → tRPC requests → Prisma / MinIO; chat and RAG requests are sent to Archibald, which reads/writes to PostgreSQL and MinIO.

**In production (public deployment):** place a reverse proxy (Nginx, Caddy, Traefik) in front of Clara and Archibald, enforce HTTPS, and adjust `NEXTAUTH_URL` and `CORS_ORIGINS` in `.env`.

---

## Technical stack (summary)

| Domain     | Clara (Next.js)                                          | Archibald (Python)                             |
| ---------- | -------------------------------------------------------- | ---------------------------------------------- |
| Framework  | Next.js 14, React 18, TypeScript                         | FastAPI, Python 3.9+ (3.12 recommended)        |
| API / Data | tRPC, Prisma, PostgreSQL, SuperJSON                      | REST, SQLAlchemy/Prisma, PostgreSQL (pgvector) |
| Auth       | NextAuth (Credentials-based authentication), JWT         | X-API-Key                                      |
| AI / RAG   | LangChain, embeddings, pgvector (delegated to Archibald) | LangChain, vectorstores, Tavily                |
| Storage    | MinIO (S3)                                               | MinIO                                          |
| Quality    | Zod, Vitest, Playwright                                  | Pydantic, Ruff, mypy, pytest                   |

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
