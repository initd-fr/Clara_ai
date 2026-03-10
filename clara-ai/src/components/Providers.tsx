"use client";

import { SessionProvider } from "~/context/SessionContext";
import { MessageProvider } from "~/context/MessageContext";
import { DataProvider } from "~/context/DataContext";
import { AppReadyProvider } from "~/context/AppReadyContext";
import { DraftProvider } from "~/context/DraftContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DataProvider>
        <MessageProvider>
          <DraftProvider>
            <AppReadyProvider>{children}</AppReadyProvider>
          </DraftProvider>
        </MessageProvider>
      </DataProvider>
    </SessionProvider>
  );
}
