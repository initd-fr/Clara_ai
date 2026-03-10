# Clara — Application Next.js

Ce dossier contient l’application **Clara** : frontend et API (Next.js, tRPC, Prisma) du projet [Clara AI](../README.md). Elle fournit l’interface utilisateur, l’authentification, la gestion des conversations et des modèles, et peut s’appuyer sur le moteur **Archibald** (optionnel) pour les appels LLM et le RAG.

---

## Rôle de ce module

- **Interface** : chat, paramètres, support, documentation
- **Auth** : NextAuth (Credentials + Google), rôles (user, support, admin), session JWT
- **API** : tRPC (chat, modèles, utilisateurs, fichiers, settings, etc.)
- **Données** : PostgreSQL (Prisma), MinIO (fichiers)
- **IA** : routers tRPC par provider (OpenAI, Anthropic, Mistral, Google), RAG avec embeddings (LangChain, pgvector), outils « simplify »

Voir le [README racine](../README.md) pour l’architecture globale et les technologies.

---

## Prérequis

- Node.js 18+ (22.x supportée)
- pnpm
- PostgreSQL (avec extension `vector` pour le RAG : `CREATE EXTENSION IF NOT EXISTS vector;`)
- MinIO (stockage)

---

## Installation

Le projet utilise **un seul `.env` à la racine** (partagé avec Archibald). Clara charge ce fichier automatiquement. Voir le [README racine](../README.md).

1. **À la racine** : `cp .env.exemple .env` puis éditer `.env`.
2. **Dans ce dossier** :

   ```bash
   cd clara-ai
   pnpm install
   pnpm db:push
   pnpm dev
   ```

   Démarre Next.js et le serveur WebSocket (ports 3000 et 3001).

---

## Scripts utiles

| Commande         | Description                                |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Next.js + WebSocket en mode développement  |
| `pnpm build`     | Build de production                        |
| `pnpm start`     | Lancement en production (Next + WebSocket) |
| `pnpm db:push`   | Appliquer le schéma Prisma à la DB         |
| `pnpm db:studio` | Ouvrir Prisma Studio                       |
| `pnpm test`      | Tests Vitest (unitaires + intégration)     |
| `pnpm test:e2e`  | Tests E2E Playwright                       |

Pour les tests E2E, installer les navigateurs si besoin : `pnpm exec playwright install chromium`.

---

## Structure du code

```
clara-ai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Connexion, inscription, reset password
│   │   ├── (authenticated)/ # Chat, home, settings, support, documentation
│   │   └── api/             # Routes API Next.js (auth, cron, contact, etc.)
│   ├── components/          # Composants React réutilisables
│   ├── context/             # Contextes React
│   ├── server/              # Logique serveur
│   │   ├── api/             # Routers tRPC (chat, auth, user, buckets, settings…)
│   │   ├── services/       # AccessControl, rate limiting, cleanup…
│   │   └── nextAuth.ts
│   └── trpc/                # Client tRPC + React Query
├── prisma/
│   └── schema.prisma        # Modèles et migrations
├── e2e/                     # Tests Playwright
└── public/
```

---

## Intégration avec Archibald (optionnel)

Si vous utilisez le moteur IA Python **Archibald**, configurez dans `.env` :

- `ARCHIBALD_API_URL` : URL de l’API (ex. `http://127.0.0.1:8000`)
- `ARCHIBALD_API_KEY` : clé API pour l’authentification

Sans ces variables, Clara utilise directement les providers LLM configurés (OpenAI, Anthropic, etc.) via les routers tRPC.

---

## Licence

La licence du projet est définie à la **racine du dépôt** : [../LICENSE](../LICENSE).
