import Bottleneck from "bottleneck";
import { AxiosResponse } from "axios";

// Configuration Bottleneck optimisée pour les appels API Python
const apiRateLimiter = new Bottleneck({
  // Limites équilibrées pour éviter la surcharge tout en permettant plus de débit
  maxConcurrent: 8, // Maximum 8 appels simultanés vers l'API Python (au lieu de 3)
  minTime: 100, // 100ms minimum entre chaque appel (au lieu de 200ms)
  reservoir: 150, // 150 appels par minute (au lieu de 50)
  reservoirRefreshAmount: 150,
  reservoirRefreshInterval: 60 * 1000, // Recharge toutes les minutes
  trackDoneStatus: true,
  highWater: 200, // Maximum 200 appels en file d'attente (au lieu de 100)
  strategy: Bottleneck.strategy.LEAK, // Rejette les anciennes requêtes
  id: "api-python-limiter",
});

// Fonction pour exécuter un appel API avec rate limiting
export async function executeWithRateLimit<T = AxiosResponse>(
  apiCall: () => Promise<T>,
  timeoutMs: number = 90000,
): Promise<T> {
  return apiRateLimiter.schedule(async () => {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`API call timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      apiCall()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  });
}

// Fonction pour obtenir les statistiques du rate limiter
export async function getRateLimitStats() {
  const counts = await apiRateLimiter.counts();
  return {
    queued: counts.QUEUED,
    running: counts.RUNNING,
    done: counts.DONE,
    // reservoir n'est pas disponible dans counts, on utilise les valeurs de configuration
    reservoir: 150, // Valeur configurée dans apiRateLimiter
  };
}

export default apiRateLimiter;
