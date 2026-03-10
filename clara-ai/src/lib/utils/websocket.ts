/**
 * Utilitaire pour gérer les URLs WebSocket selon l'environnement
 */

export function getWebSocketUrl(): string {
  if (process.env.NODE_ENV === "production") {
    // En production, utiliser le même port que Next.js
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return `wss://${url.hostname}`;
    }
    // Fallback si NEXT_PUBLIC_APP_URL n'est pas défini
    return "wss://localhost:3000";
  }
  return "ws://localhost:3001";
}

export function getWebSocketUrlForClient(): string {
  if (typeof window === "undefined") {
    return getWebSocketUrl();
  }

  // Côté client, utiliser l'URL de l'environnement
  if (process.env.NODE_ENV === "production") {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return `wss://${url.hostname}`;
    }
    // Fallback vers l'hostname actuel
    return `wss://${window.location.hostname}`;
  }
  return "ws://localhost:3001";
}

/**
 * Fonction simple pour obtenir l'URL WebSocket côté client
 */
export function getWebSocketUrlSimple(): string {
  if (typeof window === "undefined") {
    return getWebSocketUrl();
  }

  if (process.env.NODE_ENV === "production") {
    // En production, utiliser le même domaine (reverse proxy route vers 3002)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return `wss://${url.hostname}`;
    }
    return `wss://${window.location.hostname}`;
  }
  return "ws://localhost:3001";
}
