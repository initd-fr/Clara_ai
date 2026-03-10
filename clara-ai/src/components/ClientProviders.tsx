"use client";

import { memo } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import ThemeProvider from "~/components/ThemeProvider";
import ToasterClient from "~/components/ToasterClient";
import { SessionProvider } from "~/context/SessionContext";
import { MessageProvider } from "~/context/MessageContext";
import { AppReadyProvider } from "~/context/AppReadyContext";
import { DraftProvider } from "~/context/DraftContext";

const ClientProviders = memo(function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        <MessageProvider>
          <DraftProvider>
            <AppReadyProvider>
              <ThemeProvider>
                {children}
                <ToasterClient />
              </ThemeProvider>
            </AppReadyProvider>
          </DraftProvider>
        </MessageProvider>
      </SessionProvider>
    </NextAuthSessionProvider>
  );
});

export default ClientProviders;
