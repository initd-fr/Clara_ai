"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  memo,
  useCallback,
} from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const SidebarProvider = memo(function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // État d'hydratation pour éviter les erreurs SSR
  const [isHydrated, setIsHydrated] = useState(false);

  // Fonction utilitaire pour lire le localStorage de manière sécurisée
  const getLocalStorageValue = useCallback(
    (key: string, defaultValue: boolean): boolean => {
      try {
        if (typeof window !== "undefined") {
          const value = localStorage.getItem(key);
          if (value === null) return defaultValue; // respecter la valeur par défaut si non défini
          return value === "true";
        }
        return defaultValue;
      } catch (error) {
        console.error(`Erreur lors de la lecture de ${key}:`, error);
        return defaultValue;
      }
    },
    [],
  );

  // Fonction utilitaire pour écrire dans le localStorage de manière sécurisée
  const setLocalStorageValue = useCallback(
    (key: string, value: boolean): void => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value.toString());
        }
      } catch (error) {
        console.error(`Erreur lors de l'écriture de ${key}:`, error);
      }
    },
    [],
  );

  // États initiaux avec valeurs par défaut
  const [isOpen, setIsOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(true);

  // Hydratation et chargement des valeurs depuis localStorage
  useEffect(() => {
    setIsHydrated(true);

    // Charger les valeurs depuis localStorage après hydratation
    const savedLocked = getLocalStorageValue("sidebar-locked", true);
    const savedOpen = getLocalStorageValue("sidebar-open", true);

    // console.log("🔍 Chargement depuis localStorage:", {
    //   savedLocked,
    //   savedOpen,
    // });

    setIsLocked(savedLocked);
    setIsOpen(savedOpen);
  }, [getLocalStorageValue]);

  // Persister l'état de verrouillage dans localStorage (seulement après hydratation)
  useEffect(() => {
    if (!isHydrated) return;
    // console.log(
    //   "💾 Sauvegarde isLocked:",
    //   isLocked,
    //   "à",
    //   new Date().toISOString(),
    // );
    setLocalStorageValue("sidebar-locked", isLocked);
  }, [isLocked, setLocalStorageValue, isHydrated]);

  // Persister l'état d'ouverture dans localStorage (seulement après hydratation)
  useEffect(() => {
    if (!isHydrated) return;
    // console.log("💾 Sauvegarde isOpen:", isOpen);
    setLocalStorageValue("sidebar-open", isOpen);
  }, [isOpen, setLocalStorageValue, isHydrated]);

  // Logique de verrouillage : si verrouillé, forcer l'ouverture
  useEffect(() => {
    if (!isHydrated) return;
    if (isLocked && !isOpen) {
      // console.log("🔒 Forcer l'ouverture car verrouillé");
      setIsOpen(true);
    }
  }, [isLocked, isOpen, isHydrated]);

  const handleSetIsLocked = useCallback((locked: boolean) => {
    setIsLocked(locked);
    if (locked) {
      // Forcer l'ouverture quand on verrouille
      setIsOpen(true);
    }
  }, []);

  const handleSetIsOpen = useCallback(
    (open: boolean | ((prev: boolean) => boolean)) => {
      // Si la sidebar est verrouillée, empêcher la fermeture
      if (isLocked) {
        if (typeof open === "function") {
          const newOpen = open(isOpen);
          if (!newOpen) return; // Empêcher la fermeture si verrouillée
        } else if (open === false) {
          return; // Empêcher la fermeture si verrouillée
        }
      }
      setIsOpen(open);
    },
    [isLocked, isOpen],
  );

  const contextValue = useMemo<SidebarContextType>(
    () => ({
      isOpen,
      setIsOpen: handleSetIsOpen,
      isLocked,
      setIsLocked: handleSetIsLocked,
    }),
    [isOpen, isLocked, handleSetIsOpen, handleSetIsLocked],
  );

  // Éviter le rendu avant l'hydratation pour éviter les erreurs SSR
  if (!isHydrated) {
    return (
      <SidebarContext.Provider value={contextValue}>
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
});

export default SidebarProvider;
