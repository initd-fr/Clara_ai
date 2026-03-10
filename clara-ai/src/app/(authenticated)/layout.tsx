////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo } from "react";
import ClientProviders from "~/components/ClientProviders";
import Sidebar from "./sidebar";
import ModalManager from "./ModalManager";
import SidebarProvider from "~/components/SidebarProvider";
import { DataProvider } from "~/context/DataContext";
import GlobalTRPCForceLogout from "./GlobalTRPCForceLogout";
import SessionHeartbeat from "./SessionHeartbeat";
import OnboardingManager from "~/components/OnboardingManager";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const AuthenticatedLayout = memo(function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <ClientProviders>
      <SidebarProvider>
        <DataProvider>
          <OnboardingManager>
              <div className="flex min-h-screen w-full flex-col bg-base-200 md:flex-row">
                <div className="w-full md:sticky md:top-0 md:h-screen md:w-auto">
                  <Sidebar />
                </div>
                <main className="flex flex-1 flex-col">
                  <div className="relative z-40 flex-1 rounded-tl-3xl rounded-tr-3xl border border-base-300 bg-base-100 shadow-lg shadow-slate-500 dark:shadow-2xl md:rounded-tr-none">
                    {children}
                  </div>
                </main>
              </div>
              <ModalManager />
              {/* Composants de gestion du force logout */}
              <GlobalTRPCForceLogout />
              <SessionHeartbeat />
            </OnboardingManager>
        </DataProvider>
      </SidebarProvider>
    </ClientProviders>
  );
});

export default AuthenticatedLayout;
