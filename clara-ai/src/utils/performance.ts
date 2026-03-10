// Utilitaires pour optimiser les performances globales

// Configuration des métriques de performance
export const PERFORMANCE_CONFIG = {
  // Seuils de performance
  THRESHOLDS: {
    FPS: {
      EXCELLENT: 60,
      GOOD: 50,
      ACCEPTABLE: 30,
    },
    MEMORY: {
      EXCELLENT: 50, // MB
      GOOD: 100, // MB
      ACCEPTABLE: 200, // MB
    },
    LOAD_TIME: {
      EXCELLENT: 1000, // ms
      GOOD: 2000, // ms
      ACCEPTABLE: 3000, // ms
    },
    RENDER_TIME: {
      EXCELLENT: 16, // ms (60fps)
      GOOD: 33, // ms (30fps)
      ACCEPTABLE: 50, // ms
    },
  },

  // Configuration du monitoring
  MONITORING: {
    ENABLED: process.env.NODE_ENV === "development",
    SAMPLE_RATE: 0.1, // 10% des utilisateurs
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 30000, // 30 secondes
  },

  // Configuration du cache
  CACHE: {
    AUTH_PAGE: 3600, // 1 heure
    STATIC_ASSETS: 86400, // 24 heures
    API_RESPONSES: 300, // 5 minutes
  },
};

// Classe pour gérer les métriques de performance
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, any[]> = new Map();
  private observers: Set<(metrics: any) => void> = new Set();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  // Enregistrer une métrique
  track(
    componentName: string,
    metricName: string,
    value: number,
    metadata?: any,
  ) {
    const key = `${componentName}_${metricName}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metric = {
      timestamp: Date.now(),
      value,
      metadata,
    };

    this.metrics.get(key)!.push(metric);

    // Notifier les observateurs
    this.observers.forEach((observer) => observer(metric));

    // Nettoyer les anciennes métriques (garder seulement les 100 dernières)
    const metrics = this.metrics.get(key)!;
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  // Obtenir les métriques pour un composant
  getMetrics(componentName: string, metricName?: string) {
    if (metricName) {
      const key = `${componentName}_${metricName}`;
      return this.metrics.get(key) || [];
    }

    const componentMetrics: any = {};
    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(componentName)) {
        const metricName = key.replace(`${componentName}_`, "");
        componentMetrics[metricName] = metrics;
      }
    }
    return componentMetrics;
  }

  // Calculer les statistiques
  getStats(componentName: string, metricName: string) {
    const metrics = this.getMetrics(componentName, metricName);
    if (metrics.length === 0) return null;

    const values = metrics.map((m: any) => m.value);
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: metrics.length,
      average: avg,
      min,
      max,
      sum,
    };
  }

  // S'abonner aux changements de métriques
  subscribe(observer: (metrics: any) => void) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Exporter les métriques
  export() {
    const exportData: any = {};
    for (const [key, metrics] of this.metrics.entries()) {
      exportData[key] = metrics;
    }
    return exportData;
  }

  // Réinitialiser les métriques
  reset() {
    this.metrics.clear();
  }
}

// Fonction pour optimiser les images
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
  } = {},
) {
  const { width, height, quality = 80, format = "webp" } = options;

  // Si c'est une image externe, retourner l'URL originale
  if (src.startsWith("http")) {
    return src;
  }

  // Pour les images locales, ajouter les paramètres d'optimisation
  const params = new URLSearchParams();
  if (width) params.append("w", width.toString());
  if (height) params.append("h", height.toString());
  params.append("q", quality.toString());
  params.append("f", format);

  return `${src}?${params.toString()}`;
}

// Fonction pour précharger les ressources critiques
export function preloadResource(href: string, as: string) {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = href;
  document.head.appendChild(link);

  return () => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };
}

// Fonction pour optimiser les polices
export function optimizeFonts(fontFamilies: string[]) {
  if (typeof window === "undefined" || !("fonts" in document)) return;

  const fontPromises = fontFamilies.map((family) =>
    (document as any).fonts.load(`1em ${family}`),
  );

  return Promise.all(fontPromises);
}

// Fonction pour mesurer le temps de chargement
export function measureLoadTime() {
  if (typeof window === "undefined") return null;

  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  return {
    domContentLoaded:
      navigation.domContentLoadedEventEnd -
      navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime,
    firstContentfulPaint: performance.getEntriesByName(
      "first-contentful-paint",
    )[0]?.startTime,
    largestContentfulPaint: performance.getEntriesByName(
      "largest-contentful-paint",
    )[0]?.startTime,
  };
}

// Fonction pour optimiser les animations
export function optimizeAnimation(callback: () => void, fps: number = 60) {
  let animationId: number;
  let lastTime = 0;
  const interval = 1000 / fps;

  const animate = (currentTime: number) => {
    if (currentTime - lastTime >= interval) {
      callback();
      lastTime = currentTime;
    }
    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

// Fonction pour optimiser le scroll
export function optimizeScroll(callback: (scrollTop: number) => void) {
  let ticking = false;
  let lastScrollTop = 0;

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop !== lastScrollTop) {
          callback(scrollTop);
          lastScrollTop = scrollTop;
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}

// Fonction pour optimiser les événements de redimensionnement
export function optimizeResize(
  callback: (width: number, height: number) => void,
  throttleMs: number = 250,
) {
  let timeoutId: NodeJS.Timeout;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width !== lastWidth || height !== lastHeight) {
        callback(width, height);
        lastWidth = width;
        lastHeight = height;
      }
    }, throttleMs);
  };

  window.addEventListener("resize", handleResize, { passive: true });

  return () => {
    window.removeEventListener("resize", handleResize);
    clearTimeout(timeoutId);
  };
}

// Fonction pour optimiser les requêtes réseau
export function optimizeNetworkRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    cache?: boolean;
    cacheKey?: string;
    cacheTime?: number;
    retries?: number;
    timeout?: number;
  } = {},
) {
  const {
    cache = true,
    cacheKey,
    cacheTime = 300000,
    retries = 3,
    timeout = 10000,
  } = options;

  return async (): Promise<T> => {
    // Vérifier le cache
    if (cache && cacheKey && typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTime) {
          return data;
        }
      }
    }

    // Effectuer la requête avec retry
    let lastError: Error;
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout),
          ),
        ]);

        clearTimeout(timeoutId);

        // Mettre en cache
        if (cache && cacheKey && typeof window !== "undefined") {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: result,
              timestamp: Date.now(),
            }),
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000),
          );
        }
      }
    }

    throw lastError!;
  };
}

// Export de l'instance singleton
export const performanceTracker = PerformanceTracker.getInstance();
