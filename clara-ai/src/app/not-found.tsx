"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCallback } from "react";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function NotFound() {
  const router = useRouter();

  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const handleGoHome = useCallback(() => {
    try {
      router.push("/");
    } catch {
      window.location.href = "/";
    }
  }, [router]);
  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div
      className="fixed inset-0 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base-100"
      role="main"
      aria-label="Page 404 - Page introuvable"
    >
      {/* Vagues de fond optimisées */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 blur-2xl" />
        <div className="from-primary/8 to-secondary/8 absolute -left-24 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br blur-xl" />
        <div className="from-secondary/8 to-accent/8 absolute -right-24 top-48 h-[300px] w-[300px] rounded-full bg-gradient-to-br blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-16 px-4 text-center sm:gap-20">
        {/* Logo avec effet de dégradé */}
        <div className="relative">
          <h1 className="logo-gradient-wa text-4xl font-medium tracking-tight sm:text-5xl">
            Clara AI
          </h1>
          <div className="from-primary/8 to-secondary/8 absolute -inset-3 -z-10 rounded-full bg-gradient-to-r blur-xl" />
        </div>

        {/* Content avec design asymétrique */}
        <div className="flex flex-col items-center gap-12 sm:gap-16">
          <div className="relative">
            {/* Cercles décoratifs optimisés */}
            <div className="absolute -left-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-primary/15 sm:h-32 sm:w-32" />
            <div className="absolute -right-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-secondary/15 sm:h-32 sm:w-32" />

            {/* 404 avec style unique */}
            <div className="relative">
              <h2
                className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-8xl font-bold leading-none tracking-tighter text-transparent sm:text-[12rem]"
                aria-label="Erreur 404"
              >
                404
              </h2>
              <div className="absolute -bottom-3 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/40 to-secondary/40 sm:w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="text-2xl font-medium text-base-content sm:text-3xl">
              Oups ! Page introuvable
            </h3>
            <p className="max-w-md text-sm text-base-content/60 sm:text-base">
              La page que vous recherchez semble avoir disparu dans le
              cyberespace.
            </p>
          </div>

          {/* Bouton avec design moderne et accessibilité */}
          <button
            onClick={handleGoHome}
            className="group relative flex items-center gap-3 rounded-2xl bg-base-200 px-6 py-3 text-base-content transition-all duration-300 hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:px-8 sm:py-4"
            aria-label="Retourner à la page d'accueil"
          >
            <span className="font-medium">Retour à l&apos;accueil</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
    ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
