"use client";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
// ?  ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
// Types dynamiques basés sur les configurations d'abonnements
export type BaseAccountType = string; // Maintenant dynamique

// Interface pour les infos utilisateur
export type UserRole = "user" | "support" | "admin" | "companyManager";
export type UserType = {
  id: string;
  firstName: string;
  lastName: string;
  accountType: string;
  role: UserRole;
  email: string;
  subscriptionInfo?: {
    hasSubscription: boolean;
    subscriptionName: string;
    dailyMessageLimit: number | null;
    storageLimitGB: number | null;
    canCreatePersonalModels: boolean;
    canAccessStoreModels: boolean;
    maxPersonalModels: number | null;
  };
};
// ?  ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
//TODO Structure du contexte
interface SessionContextType {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserType | null;
  validAccountTypes: string[];
  totalStorageLimit: (type: string) => number;
  dailyMessagesLimit: (type: string) => number;
}

const SessionContext = createContext<SessionContextType>({
  status: "loading",
  user: null,
  validAccountTypes: [],
  totalStorageLimit: () => 0,
  dailyMessagesLimit: () => 0,
});

const SessionProvider = memo(function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ^ ///////////////////////////////////////////////////////////////////////////////STATE&VARIABLES//////////////////////////////////////////////////////////////////////////////
  const { data: session, status: nextAuthStatus } = useSession();

  // Récupérer les informations d'abonnement
  const { data: subscriptionInfo } = api.user.getSubscriptionInfo.useQuery(
    undefined,
    {
      enabled: nextAuthStatus === "authenticated",
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // ^ ///////////////////////////////////////////////////////////////////////////////STATE&VARIABLES//////////////////////////////////////////////////////////////////////////////

  // ~ ///////////////////////////////////////////////////////////////////////////////EFFECTS/////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour calculer la limite de stockage (dynamique)
  const totalStorageLimit = useCallback((): number => {
    // Utiliser les informations d'abonnement si disponibles
    if (subscriptionInfo?.hasSubscription && subscriptionInfo.storageLimitGB) {
      return subscriptionInfo.storageLimitGB * 1024; // Convertir GB en MB
    }

    // Si pas d'abonnement ou pas de limite définie, illimité
    return -1; // -1 = illimité
  }, [subscriptionInfo]);

  // Fonction pour calculer la limite de messages quotidiens (dynamique)
  const dailyMessagesLimit = useCallback((): number => {
    // Utiliser uniquement les informations d'abonnement
    if (
      subscriptionInfo?.hasSubscription &&
      subscriptionInfo.dailyMessageLimit
    ) {
      return subscriptionInfo.dailyMessageLimit;
    }

    // Si pas d'abonnement ou pas de limite définie, illimité
    return -1; // -1 = illimité
  }, [subscriptionInfo]);

  // ~ ///////////////////////////////////////////////////////////////////////////////EFFECTS/////////////////////////////////////////////////////////////////////////////////////

  const [contextValue, setContextValue] = useState<SessionContextType>({
    status: "loading",
    user: null,
    validAccountTypes: [],
    totalStorageLimit,
    dailyMessagesLimit,
  });

  // Mettre à jour le contexte utilisateur
  useEffect(() => {
    if (nextAuthStatus === "authenticated" && session?.user) {
      const user = session.user as any; // Type assertion pour accéder aux propriétés étendues

      setContextValue((prev) => ({
        ...prev,
        status: "authenticated",
        user: {
          id: String(user.id),
          accountType: user.accountType,
          role: user.role as UserRole,
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          subscriptionInfo: subscriptionInfo,
        },
      }));
    } else if (nextAuthStatus === "unauthenticated") {
      setContextValue((prev) => ({
        ...prev,
        status: "unauthenticated",
        user: null,
      }));
    }
  }, [session, nextAuthStatus, subscriptionInfo]);

  const memoizedContextValue = useMemo<SessionContextType>(
    () => ({
      ...contextValue,
      totalStorageLimit,
      dailyMessagesLimit,
    }),
    [contextValue, totalStorageLimit, dailyMessagesLimit],
  );

  return (
    <SessionContext.Provider value={memoizedContextValue}>
      {children}
    </SessionContext.Provider>
  );
});

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useAppSession must be used within a SessionProvider");
  }
  return context;
}

export { SessionProvider };
