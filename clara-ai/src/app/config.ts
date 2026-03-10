// NOTES: Configuration optimisée pour les performances

export const APP_CONFIG = {
  name: "Clara AI",
  version: "Version MIT Licence",
  year: new Date().getFullYear(),

  // Liens du développeur (page d'accueil)
  developer: {
    github: process.env.NEXT_PUBLIC_DEV_GITHUB_URL ?? "https://github.com",
    linkedin: process.env.NEXT_PUBLIC_DEV_LINKEDIN_URL ?? "",
  },

  // Configuration des performances
  performance: {
    // Seuils de performance
    thresholds: {
      fps: {
        excellent: 60,
        good: 50,
        acceptable: 30,
      },
      memory: {
        excellent: 50, // MB
        good: 100, // MB
        acceptable: 200, // MB
      },
      loadTime: {
        excellent: 1000, // ms
        good: 2000, // ms
        acceptable: 3000, // ms
      },
      renderTime: {
        excellent: 16, // ms (60fps)
        good: 33, // ms (30fps)
        acceptable: 50, // ms
      },
    },

    // Configuration du monitoring
    monitoring: {
      enabled: process.env.ENABLE_MONITORING === "true",
      sampleRate: 0.1, // 10% des utilisateurs
      batchSize: 10,
      flushInterval: 30000, // 30 secondes
    },

    // Configuration du cache
    cache: {
      authPage: 3600, // 1 heure
      staticAssets: 86400, // 24 heures
      apiResponses: 300, // 5 minutes
    },
  },

  // Configuration des URLs
  urls: {
    base:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000/",

    // Routes d'authentification
    auth: "/auth",

    // Routes principales (authentifiées)
    home: "/home",
    support: "/support",
    documentation: "/documentation",
    settings: "/settings",

    // Routes de chat
    chat: "/chat",

    // Routes API
    api: {
      auth: "/api/auth",
      trpc: "/api/trpc",
      cron: "/api/cron",
    },

    // Routes publiques
    public: "/",
    notFound: "/404",
  },

  // Configuration des API
  api: {
    timeout: 10000, // 10 secondes
    retries: 3,
    rateLimit: {
      free: { requests: 100, window: 60000 }, // 100 req/min
      basic: { requests: 500, window: 60000 }, // 500 req/min
      premium: { requests: 1000, window: 60000 }, // 1000 req/min
      enterprise: { requests: 2000, window: 60000 }, // 2000 req/min
    },
  },

  // Configuration Bottleneck optimisée pour serveur Xeon + 2 containers
  bottleneck: {
    // Limites de base - Optimisé pour Xeon 2386G (6c/12t)
    maxConcurrent: 50, // Augmenté pour 3 cœurs dédiés
    minTime: 20, // Réduit pour plus de réactivité

    // Reservoir (rate limiting) - Optimisé pour la puissance
    reservoir: 5000, // 5000 req/min par container
    reservoirRefreshAmount: 5000, // Recharge complète
    reservoirRefreshInterval: 60 * 1000, // 60 secondes

    // File d'attente - Optimisé pour éviter les blocages
    highWater: 25000, // Augmenté pour la puissance

    // Stratégie - Optimisé pour la performance
    strategy: "LEAK", // Rejette les anciennes requêtes

    // Timeout et retry - Optimisé pour la fiabilité
    timeout: 60000, // Augmenté à 60 secondes
    retryCount: 2, // Réduit pour éviter les cascades
    retryDelay: 3000, // Augmenté à 3 secondes

    // Suivi et monitoring
    trackDoneStatus: true,

    // Identifiant pour le debugging
    id: "clara-xeon-limiter",
  },

  // Configuration de sécurité
  security: {
    sessionTimeout: 60 * 60 * 24 * 7, // 7 jours
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes
  },

  // Configuration des thèmes
  theme: {
    defaultTheme: "light",
    themes: ["light", "dark"] as const,
    storageKey: "theme",
  },
} as const;

// Types dérivés de la configuration
export type AppConfig = typeof APP_CONFIG;
export type ThemeType = AppConfig["theme"]["themes"][number];
