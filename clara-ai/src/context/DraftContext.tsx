"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type DraftContextType = {
  getDraft: (chatId: string) => string;
  setDraft: (chatId: string, value: string) => void;
  clearDraft: (chatId: string) => void;
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const DRAFT_KEY_PREFIX = "chat:draft:";

const DraftContext = createContext<DraftContextType | null>(null);

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<Record<string, number>>({});

  const getDraft = useCallback(
    (chatId: string): string => {
      if (!chatId) return "";
      const inMemory = drafts[chatId];
      if (typeof inMemory === "string") return inMemory;
      try {
        const stored = sessionStorage.getItem(DRAFT_KEY_PREFIX + chatId);
        return stored ?? "";
      } catch {
        return "";
      }
    },
    [drafts],
  );

  const persistDraft = useCallback((chatId: string, value: string) => {
    try {
      sessionStorage.setItem(DRAFT_KEY_PREFIX + chatId, value);
    } catch {}
  }, []);

  const setDraft = useCallback(
    (chatId: string, value: string) => {
      if (!chatId) return;
      setDrafts((prev) => ({ ...prev, [chatId]: value }));
      // debounce 300ms pour limiter I/O
      window.clearTimeout(saveTimerRef.current[chatId]);
      saveTimerRef.current[chatId] = window.setTimeout(() => {
        persistDraft(chatId, value);
      }, 300);
    },
    [persistDraft],
  );

  const clearDraft = useCallback((chatId: string) => {
    if (!chatId) return;
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[chatId];
      return copy;
    });
    try {
      sessionStorage.removeItem(DRAFT_KEY_PREFIX + chatId);
    } catch {}
  }, []);

  const value = useMemo<DraftContextType>(
    () => ({ getDraft, setDraft, clearDraft }),
    [getDraft, setDraft, clearDraft],
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useDraftContext() {
  const ctx = useContext(DraftContext);
  if (!ctx) {
    return {
      getDraft: () => "",
      setDraft: () => {},
      clearDraft: () => {},
    } satisfies DraftContextType;
  }
  return ctx;
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
