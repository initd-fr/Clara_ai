"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  memo,
} from "react";

interface DataState {
  models?: any[];
  storeModels?: any[];
  storeHomeModels?: any[];
  tickets?: any[];
  isLoadingModels: boolean;
  isLoadingStore: boolean;
  isLoadingStoreHome: boolean;
  isLoadingTickets: boolean;
}

interface DataContextType {
  data: DataState;
  updateData: (updates: Partial<DataState>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DataProvider = memo(function DataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<DataState>({
    isLoadingModels: true,
    isLoadingStore: true,
    isLoadingStoreHome: true,
    isLoadingTickets: true,
  });

  const updateData = useCallback((updates: Partial<DataState>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const contextValue = useMemo<DataContextType>(
    () => ({
      data,
      updateData,
    }),
    [data, updateData],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
});

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

export { DataProvider };
