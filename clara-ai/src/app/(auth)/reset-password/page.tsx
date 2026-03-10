////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";

import { memo } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { APP_CONFIG } from "~/app/config";
import ThemeToggle from "./ThemeToggle";
import { Logo } from "../../_components/Logo";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const ResetPasswordPage = memo(() => {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
      {/* Bouton de thème optimisé */}
      <ThemeToggle />

      {/* Vagues de fond optimisées */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
        <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
        <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
      </div>

      {/* Carte principale responsive et accessible */}
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex h-full flex-col px-6 py-8 sm:px-8 md:px-10 md:py-12">
          {/* Logo avec accessibilité */}
          <div className="text-center">
            <Logo />
          </div>

          {/* Contenu principal avec flex et accessibilité */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-medium text-base-content">
                Réinitialisation du mot de passe
              </h1>
              <p className="mt-2 text-sm text-base-content/60">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>
            <div className="mt-12">
              <ResetPasswordForm />
            </div>
          </div>
        </div>

        {/* Footer optimisé */}
        <div className="border-t border-base-content/10 p-4 text-center text-sm text-base-content/60">
          {APP_CONFIG.version} © {APP_CONFIG.year} Clara AI
        </div>
      </div>
    </div>
  );
});
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

ResetPasswordPage.displayName = "ResetPasswordPage";

export default ResetPasswordPage;
