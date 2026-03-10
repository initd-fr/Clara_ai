// Optimisations pour la sidebar

export const SIDEBAR_OPTIMIZATIONS = {
  // Configuration des breakpoints responsive
  breakpoints: {
    mobile: "max-width: 768px",
    tablet: "min-width: 769px and max-width: 1024px",
    desktop: "min-width: 1025px",
    large: "min-width: 1280px",
  },

  // Configuration des animations
  animations: {
    logo: {
      duration: 0.3,
      spring: {
        stiffness: 80,
        damping: 18,
      },
    },
    sidebar: {
      duration: 0.6,
      spring: {
        stiffness: 80,
        damping: 18,
      },
    },
  },

  // Configuration du cache
  cache: {
    modelsList: {
      staleTime: 5 * 60 * 1000, // 5min en dev et prod
      gcTime: 10 * 60 * 1000, // 10min en dev et prod
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Désactivé pour éviter les problèmes de synchronisation
    },
    userData: {
      staleTime: 10 * 60 * 1000, // 10min en dev et prod
      gcTime: 30 * 60 * 1000, // 30min en dev et prod
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Désactivé pour éviter les problèmes de synchronisation
    },
  },

  // Configuration des skeletons
  skeletons: {
    modelsCount: 8,
    animationDuration: 1.5,
    staggerDelay: 0.15,
  },
};

// Hook pour optimiser les requêtes tRPC
export const useOptimizedQueries = () => {
  return {
    modelsQuery: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Désactivé pour éviter les problèmes de synchronisation
      staleTime: SIDEBAR_OPTIMIZATIONS.cache.modelsList.staleTime,
      gcTime: SIDEBAR_OPTIMIZATIONS.cache.modelsList.gcTime,
      retry: 3, // Retry standard
      retryDelay: 2000, // Retry standard
    },
    userDataQuery: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Désactivé pour éviter les problèmes de synchronisation
      staleTime: SIDEBAR_OPTIMIZATIONS.cache.userData.staleTime,
      gcTime: SIDEBAR_OPTIMIZATIONS.cache.userData.gcTime,
      retry: 3, // Retry standard
      retryDelay: 2000, // Retry standard
    },
  };
};

// Utilitaires pour les performances
export const performanceUtils = {
  // Debounce pour les interactions utilisateur
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle pour les animations
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number,
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};
