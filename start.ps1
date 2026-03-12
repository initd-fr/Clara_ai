# Clara AI — Lancer la stack Docker (PostgreSQL, MinIO, Clara, Archibald)
# Usage : copier .env.exemple en .env, remplir si besoin, puis : .\start.ps1
# Un seul fichier .env à la racine, partagé par Clara et Archibald.

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvExemple = Join-Path $RootDir ".env.exemple"
$EnvFile = Join-Path $RootDir ".env"

Write-Host "=============================================="
Write-Host "  Clara AI — Démarrage de la stack Docker"
Write-Host "=============================================="
Write-Host ""

# Vérifier Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installé ou pas dans le PATH." -ForegroundColor Red
    Write-Host "   Installez Docker Desktop : https://docs.docker.com/desktop/setup/install/windows-install/"
    exit 1
}

docker compose version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose n'est pas disponible." -ForegroundColor Red
    Write-Host "   Utilisez un Docker récent (Compose V2 inclus)."
    exit 1
}

# Fichier .env obligatoire à la racine
if (-not (Test-Path $EnvFile)) {
    if (-not (Test-Path $EnvExemple)) {
        Write-Host "Fichier .env.exemple introuvable à la racine du dépôt." -ForegroundColor Red
        exit 1
    }
    Write-Host "Fichier .env absent : copie de .env.exemple vers .env"
    Copy-Item $EnvExemple $EnvFile

    $NextAuthSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
    $ArchibaldKey = "archibald-" + ([BitConverter]::ToString((1..16 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]).Replace("-", "").ToLower())

    (Get-Content $EnvFile -Raw) -replace "NEXTAUTH_SECRET=.*", "NEXTAUTH_SECRET=$NextAuthSecret" `
        -replace "ARCHIBALD_API_KEY=.*", "ARCHIBALD_API_KEY=$ArchibaldKey" `
        -replace "API_KEY=.*", "API_KEY=$ArchibaldKey" | Set-Content $EnvFile -NoNewline

    Write-Host "   .env créé avec NEXTAUTH_SECRET et API_KEY générés. Pensez à ajouter vos clés LLM (OPENAI_API_KEY, etc.) pour le chat."
    Write-Host ""
}

# Build et démarrage
Write-Host "Construction des images et démarrage des conteneurs..."
Set-Location $RootDir
docker compose up -d --build

# Attendre que PostgreSQL soit prêt
Write-Host ""
Write-Host "Attente du démarrage de PostgreSQL..."
Start-Sleep -Seconds 5
$ready = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $null = docker compose exec -T postgres pg_isready -U clara -d clara 2>&1
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 2
}

# Appliquer le schéma Prisma
Write-Host ""
Write-Host "Application du schéma de base de données (Prisma)..."
try {
    docker compose run --rm clara pnpm db:push
} catch {}

# Créer l'utilisateur par défaut Clara
Write-Host ""
Write-Host "Création de l'utilisateur par défaut Clara..."
try {
    docker compose run --rm clara node src/scripts/createClaraUser.js
} catch {}

# Créer les 3 providers par défaut
Write-Host ""
Write-Host "Création des providers par défaut (OpenAI, Mistral, Google)..."
try {
    docker compose run --rm clara node src/scripts/seedDefaultProviders.js
} catch {}

Write-Host ""
Write-Host "=============================================="
Write-Host "  Clara AI est prête"
Write-Host "=============================================="
Write-Host ""
Write-Host "  Application (Clara)  : http://localhost:3000"
Write-Host "  API Archibald        : http://localhost:8000"
Write-Host "  Console MinIO        : http://localhost:9001 (minioadmin / minioadmin)"
Write-Host ""
Write-Host "  Compte par défaut : voir les variables CLARA_DEFAULT_* dans le .env"
Write-Host ""
Write-Host "  Pour arrêter la stack : docker compose down"
Write-Host "  Pour voir les logs     : docker compose logs -f"
Write-Host ""
Write-Host "  Pour plus d'infos      : README.md, clara-ai/README.md, archibald/README.md"
Write-Host ""
