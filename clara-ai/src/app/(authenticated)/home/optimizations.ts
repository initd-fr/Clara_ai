// Optimisations pour la page home
export const HOME_OPTIMIZATIONS = {
  // Configuration des breakpoints responsive
  breakpoints: {
    mobile: "max-width: 640px",
    tablet: "min-width: 641px and max-width: 768px",
    desktop: "min-width: 769px and max-width: 1024px",
    large: "min-width: 1025px",
  },

  // Configuration des images
  images: {
    banner: {
      sizes:
        "(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw",
      priority: true,
      quality: 85,
    },
    store: {
      sizes:
        "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw",
      priority: false,
      quality: 80,
    },
  },

  // Configuration du cache pour les actualités
  cache: {
    news: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    store: {
      staleTime: 0, // Pas de cache pour les modèles store (mise à jour immédiate)
      gcTime: 30 * 60 * 1000, // 30 minutes (anciennement cacheTime)
      refetchOnWindowFocus: true, // Rafraîchir au focus de la fenêtre
      refetchOnMount: true, // Rafraîchir au montage du composant
    },
  },

  // Configuration des animations
  animations: {
    cards: {
      speed: "fast",
      direction: "right",
      pauseOnHover: true,
    },
    hover: {
      scale: 1.05,
      duration: 200,
    },
  },

  // Configuration des hauteurs responsive
  heights: {
    banner: {
      mobile: "300px",
      tablet: "350px",
      desktop: "400px",
    },
    news: {
      mobile: "280px",
      tablet: "320px",
      desktop: "350px",
    },
  },

  // Configuration des espacements
  spacing: {
    section: {
      mobile: "gap-4",
      tablet: "gap-6",
      desktop: "gap-8",
    },
    padding: {
      mobile: "p-4",
      tablet: "p-6",
      desktop: "p-8",
    },
  },
};

// Hook pour optimiser les requêtes de la page home
export const useHomeOptimizations = () => {
  return {
    newsQuery: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: HOME_OPTIMIZATIONS.cache.news.staleTime,
      gcTime: HOME_OPTIMIZATIONS.cache.news.gcTime,
    },
    storeQuery: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: HOME_OPTIMIZATIONS.cache.store.staleTime,
      gcTime: HOME_OPTIMIZATIONS.cache.store.gcTime,
    },
  };
};

// Utilitaires pour les performances de la page home
export const homePerformanceUtils = {
  // Intersection Observer pour le lazy loading
  createIntersectionObserver: (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) => {
    return new IntersectionObserver(callback, {
      rootMargin: "50px",
      threshold: 0.1,
      ...options,
    });
  },

  // Preload des images importantes
  preloadImage: (src: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  },

  // Optimisation du scroll
  throttleScroll: (callback: () => void) => {
    let ticking = false;
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
        ticking = true;
      }
    };
  },
};

// Configuration pour ISR (Incremental Static Regeneration)
export const ISR_CONFIG = {
  // Revalidation time pour les actualités (en secondes)
  revalidate: 300, // 5 minutes

  // Configuration pour les pages statiques
  staticProps: {
    revalidate: 3600, // 1 heure pour les données statiques
  },
};
