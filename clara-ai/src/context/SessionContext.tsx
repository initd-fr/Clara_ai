"use client";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
  memo,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
// ?  ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
export type BaseAccountType = string;
export type UserType = {
  id: string;
  firstName: string;
  lastName: string;
  accountType: string;
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
}

const SessionContext = createContext<SessionContextType>({
  status: "loading",
  user: null,
  validAccountTypes: [],
});

const SessionProvider = memo(function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ^ ///////////////////////////////////////////////////////////////////////////////STATE&VARIABLES//////////////////////////////////////////////////////////////////////////////
  const { data: session, status: nextAuthStatus } = useSession();

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

  const [contextValue, setContextValue] = useState<SessionContextType>({
    status: "loading",
    user: null,
    validAccountTypes: [],
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
    () => ({ ...contextValue }),
    [contextValue],
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
