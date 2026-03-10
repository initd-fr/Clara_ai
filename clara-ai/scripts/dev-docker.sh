#!/usr/bin/env bash
# Script pour lancer PostgreSQL (avec pgvector) et MinIO en conteneurs Docker pour la démo / dev local.
# Prérequis : Docker Desktop lancé.

set -e

CONTAINER_PG_NAME="clara-pg-dev"
CONTAINER_MINIO_NAME="clara-minio-dev"
PG_IMAGE="pgvector/pgvector:pg16"
MINIO_IMAGE="minio/minio:latest"
PG_PORT="${PG_PORT:-5432}"
MINIO_API_PORT="${MINIO_API_PORT:-9000}"
MINIO_CONSOLE_PORT="${MINIO_CONSOLE_PORT:-9001}"
PG_USER="${PG_USER:-clara}"
PG_PASSWORD="${PG_PASSWORD:-clara}"
PG_DB="${PG_DB:-clara_dev}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"

echo "🐳 Démarrage des conteneurs Docker pour Clara AI (dev/démo)"
echo ""

# --- PostgreSQL + pgvector ---
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_PG_NAME}$"; then
  echo "▶ Démarrage du conteneur PostgreSQL existant: ${CONTAINER_PG_NAME}"
  docker start "$CONTAINER_PG_NAME"
else
  echo "▶ Création et démarrage du conteneur PostgreSQL (pgvector): ${CONTAINER_PG_NAME}"
  docker run -d \
    --name "$CONTAINER_PG_NAME" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -e POSTGRES_DB="$PG_DB" \
    -p "$PG_PORT:5432" \
    "$PG_IMAGE" \
    postgres -c shared_preload_libraries=vector
fi

# --- MinIO ---
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_MINIO_NAME}$"; then
  echo "▶ Démarrage du conteneur MinIO existant: ${CONTAINER_MINIO_NAME}"
  docker start "$CONTAINER_MINIO_NAME"
else
  echo "▶ Création et démarrage du conteneur MinIO: ${CONTAINER_MINIO_NAME}"
  docker run -d \
    --name "$CONTAINER_MINIO_NAME" \
    -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
    -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
    -p "$MINIO_API_PORT:9000" \
    -p "$MINIO_CONSOLE_PORT:9001" \
    "$MINIO_IMAGE" \
    server /data --console-address ":9001"
fi

echo ""
echo "⏳ Attente du démarrage de PostgreSQL (extension vector)..."
sleep 3
docker exec "$CONTAINER_PG_NAME" psql -U "$PG_USER" -d "$PG_DB" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
echo ""
echo "✅ Conteneurs prêts."
echo ""
echo "📋 À mettre dans ton .env pour la démo (dev) :"
echo "---"
echo "DATABASE_URL=\"postgresql://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}?schema=public\""
echo "MINIO_ENDPOINT=localhost"
echo "MINIO_ACCESS_KEY=${MINIO_ROOT_USER}"
echo "MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}"
echo "MINIO_USESSL=0"
echo "MINIO_PORT=${MINIO_API_PORT}"
echo "---"
echo ""
echo "Puis : pnpm db:push   (créer les tables en base)"
echo ""
echo "MinIO console : http://localhost:${MINIO_CONSOLE_PORT} (${MINIO_ROOT_USER} / ${MINIO_ROOT_PASSWORD})"
