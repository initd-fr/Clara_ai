import {
  createContext,
  useContext,
  useEffect,
  useState,
  memo,
  useCallback,
} from "react";
import { useAppSession } from "./SessionContext";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";

const AppReadyContext = createContext(false);

const AppReadyProvider = memo(function AppReadyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAppSession();
  const queryClient = useQueryClient();

  // Sidebar - avec optimisations cohérentes
  const {
    isLoading: isLoadingModels,
    isFetching: isFetchingModels,
    data: modelsData,
  } = api.userModels.getModels.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Désactivé pour éviter les problèmes de synchronisation
    staleTime: 5 * 60 * 1000, // 5min
    gcTime: 10 * 60 * 1000, // 10min
  });

  const [isAppReady, setIsAppReady] = useState(false);

  // Vérifier que les requêtes sont terminées et que les données sont disponibles
  const checkQueriesReady = useCallback(() => {
    try {
      // Vérifier les modèles
      const modelsQuery = queryClient.getQueryState([
        "userModels",
        "getModels",
        undefined,
      ]);
      const modelsData = queryClient.getQueryData([
        "userModels",
        "getModels",
        undefined,
      ]);

      // Vérifier que la requête modèles ne est plus en cours ET a réussi
      const modelsNotFetching = modelsQuery?.fetchStatus !== "fetching";
      const modelsSuccess = modelsQuery?.status === "success";
      const modelsHasData = Array.isArray(modelsData);
      const modelsReady = modelsNotFetching && modelsSuccess && modelsHasData;

      const allReady = modelsReady;

      return allReady;
    } catch (error) {
      return false;
    }
  }, [queryClient]);

  useEffect(() => {
    if (status !== "loading" && !isLoadingModels && !isFetchingModels) {
      const queriesReady = checkQueriesReady();

      if (queriesReady) {
        setIsAppReady(true);
      } else {
        const timer = setTimeout(() => {
          const queriesReadyRetry = checkQueriesReady();
          if (queriesReadyRetry) {
            setIsAppReady(true);
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [
    status,
    isLoadingModels,
    isFetchingModels,
    modelsData,
    checkQueriesReady,
  ]);

  return (
    <AppReadyContext.Provider value={isAppReady}>
      {children}
    </AppReadyContext.Provider>
  );
});

export function useAppReady() {
  return useContext(AppReadyContext);
}

export { AppReadyProvider };
