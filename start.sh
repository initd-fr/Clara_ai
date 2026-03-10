#!/usr/bin/env bash
# Clara AI — Lancer la stack Docker (PostgreSQL, MinIO, Clara, Archibald)
# Usage : copier .env.exemple en .env, remplir si besoin, puis : ./start.sh
# Un seul fichier .env à la racine, partagé par Clara et Archibald.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_EXEMPLE="${ROOT_DIR}/.env.exemple"
ENV_FILE="${ROOT_DIR}/.env"

echo "=============================================="
echo "  Clara AI — Démarrage de la stack Docker"
echo "=============================================="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker n'est pas installé ou pas dans le PATH."
  echo "   Installez Docker : https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo "❌ Docker Compose n'est pas disponible."
  echo "   Utilisez un Docker récent (Compose V2 inclus)."
  exit 1
fi

# Fichier .env obligatoire à la racine (commun Clara + Archibald)
if [ ! -f "$ENV_FILE" ]; then
  if [ ! -f "$ENV_EXEMPLE" ]; then
    echo "❌ Fichier .env.exemple introuvable à la racine du dépôt."
    exit 1
  fi
  echo "📄 Fichier .env absent : copie de .env.exemple vers .env"
  cp "$ENV_EXEMPLE" "$ENV_FILE"
  NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me-$(date +%s)")
  ARCHIBALD_KEY="archibald-$(openssl rand -hex 16 2>/dev/null || echo "local")"
  if sed --version &>/dev/null; then
    sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" "$ENV_FILE"
    sed -i.bak "s|ARCHIBALD_API_KEY=.*|ARCHIBALD_API_KEY=${ARCHIBALD_KEY}|" "$ENV_FILE"
    sed -i.bak "s|API_KEY=.*|API_KEY=${ARCHIBALD_KEY}|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
  else
    # macOS
    sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" "$ENV_FILE"
    sed -i.bak "s|ARCHIBALD_API_KEY=.*|ARCHIBALD_API_KEY=${ARCHIBALD_KEY}|" "$ENV_FILE"
    sed -i.bak "s|API_KEY=.*|API_KEY=${ARCHIBALD_KEY}|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
  fi
  echo "   .env créé avec NEXTAUTH_SECRET et API_KEY générés. Pensez à ajouter vos clés LLM (OPENAI_API_KEY, etc.) pour le chat."
  echo ""
fi

# Build et démarrage
echo "🐳 Construction des images et démarrage des conteneurs..."
cd "$ROOT_DIR"
docker compose up -d --build

# Attendre que PostgreSQL soit prêt
echo ""
echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 5
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose exec -T postgres pg_isready -U clara -d clara 2>/dev/null; then
    break
  fi
  sleep 2
done

# Appliquer le schéma Prisma (une fois)
echo ""
echo "📦 Application du schéma de base de données (Prisma)..."
docker compose run --rm clara pnpm db:push || true

# Créer l'utilisateur par défaut Clara (clara@clara.local / claraai)
echo ""
echo "👤 Création de l'utilisateur par défaut Clara..."
docker compose run --rm clara node src/scripts/createClaraUser.js || true

# Créer les 3 providers par défaut (OpenAI, Mistral, Google)
echo ""
echo "🔌 Création des providers par défaut (OpenAI, Mistral, Google)..."
docker compose run --rm clara node src/scripts/seedDefaultProviders.js || true

echo ""
echo "=============================================="
echo "  ✅ Clara AI est prête"
echo "=============================================="
echo ""
echo "  • Application (Clara)  : http://localhost:3000"
echo "  • API Archibald        : http://localhost:8000"
echo "  • Console MinIO        : http://localhost:9001 (minioadmin / minioadmin)"
echo ""
echo "  Compte par défaut : voir les variables CLARA_DEFAULT_* dans le .env"
echo ""
echo "  Pour arrêter la stack : docker compose down"
echo "  Pour voir les logs     : docker compose logs -f"
echo ""
echo "  Pour plus d’infos      : README.md, clara-ai/README.md, archibald/README.md"
echo ""
