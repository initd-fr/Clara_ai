////////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";
import { useEffect, useState } from "react";
////////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////
/**
 * Hook optimisé pour s'assurer que le composant est rendu côté client
 * Évite les erreurs de hydration et les problèmes de contexte
 */
export function useClientSide() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Utiliser requestAnimationFrame pour éviter les re-renders bloquants
    const timer = requestAnimationFrame(() => {
      setIsClient(true);
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  return isClient;
}

/**
 * Hook pour utiliser usePathname de manière sécurisée
 */
export function useSafePathname() {
  const isClient = useClientSide();
  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    if (!isClient) return;

    // Utiliser window.location.pathname au lieu de usePathname dans useEffect
    setPathname(window.location.pathname);
  }, [isClient]);

  return pathname;
}

/**
 * Hook pour utiliser useRouter de manière sécurisée
 */
export function useSafeRouter() {
  const isClient = useClientSide();
  const [router, setRouter] = useState<any>(null);

  useEffect(() => {
    if (!isClient) return;

    // Créer un objet router compatible avec window.history
    setRouter({
      push: (path: string) => window.history.pushState({}, "", path),
      replace: (path: string) => window.history.replaceState({}, "", path),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
    });
  }, [isClient]);

  return router;
}
////////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////
