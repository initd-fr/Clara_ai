////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { getServerAuthSession } from "~/server/nextAuth";
import SettingsProvider from "./SettingsProvider";
import LegalSection from "./LegalSection";
import type { Session } from "next-auth";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default async function Settings() {
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const session = (await getServerAuthSession()) as Session | null;

  if (!session || !session.user) {
    return;
  }
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-base-300/50 bg-base-100/80 px-6 py-6 backdrop-blur-xl sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                Paramètres
              </h1>
              <p className="mt-1 text-sm text-base-content/70 sm:text-base">
                Gérez votre compte et vos préférences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="space-y-6 lg:col-span-2">
            {/* Section Informations du compte */}
            <div className="collapse collapse-arrow overflow-hidden rounded-2xl border border-base-300/50 bg-base-100 shadow-lg backdrop-blur-sm">
              <input type="checkbox" name="account-accordion" />
              <div className="collapse-title bg-gradient-to-r from-base-200/50 to-base-200/30 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-base-content">
                    Informations du compte
                  </h2>
                  <p className="text-sm font-normal text-base-content/70">
                    Consultez vos informations personnelles et modifiez votre
                    mot de passe
                  </p>
                </div>
              </div>
              <div className="collapse-content">
                <div className="p-6">
                  <SettingsProvider />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar - Informations rapides */}
          <div className="space-y-6">
            {/* Carte utilisateur */}
            <div className="overflow-hidden rounded-2xl border border-base-300/50 bg-base-100 shadow-lg backdrop-blur-sm">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <h3 className="font-semibold text-base-content">
                          {session.user.firstName} {session.user.lastName}
                        </h3>
                      </div>
                      <p className="text-sm text-base-content/70">
                        {session.user.email}
                      </p>
                      <p className="mt-1 text-xs text-base-content/50">
                        Inscrit depuis{" "}
                        {new Date().toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Informations légales */}
            <div className="collapse collapse-arrow overflow-hidden rounded-2xl border border-base-300/50 bg-base-100 shadow-lg backdrop-blur-sm">
              <input type="checkbox" name="legal-accordion" />
              <div className="collapse-title bg-gradient-to-r from-base-200/50 to-base-200/30 px-6 py-4">
                <h3 className="font-semibold text-base-content">
                  Informations légales
                </h3>
              </div>
              <div className="collapse-content">
                <div className="p-6">
                  <LegalSection />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
