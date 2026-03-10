# Archibald — FastAPI (production)
FROM python:3.12-slim AS base
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

FROM base AS deps
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --no-install-project

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/.venv ./.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY app ./app
COPY pyproject.toml ./

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
