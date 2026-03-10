"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  // Message d'erreur par défaut pour la double session
  const getErrorMessage = (error: string | null) => {
    if (!error) return "";

    // Si c'est une erreur de double session
    if (error.includes("session")) {
      return "Une autre session est active sur ce compte. Veuillez vous déconnecter d'abord.";
    }

    // Pour les autres erreurs, on essaie de décoder
    try {
      return decodeURIComponent(error);
    } catch {
      return error;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300">
      {/* Vagues de fond */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
        <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
        <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
      </div>

      {/* Carte d'erreur */}
      <div className="relative mx-auto h-[500px] w-[1000px] overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex h-full flex-col px-12 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold">
              <span className="logo-gradient">Clara</span>
              <span className="text-base-content">.ai</span>
            </h1>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <h2 className="mb-6 text-2xl font-semibold text-primary">
                Oups ! Une erreur est survenue
              </h2>
              <div className="rounded-xl border  border-error/50 bg-base-200/50 p-6 backdrop-blur-sm">
                <p className="text-base-content/90">{getErrorMessage(error)}</p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => router.push("/auth")}
              className="btn h-14 w-full max-w-xs rounded-xl bg-primary font-medium text-primary-content shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
            >
              Retour à la page de connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
