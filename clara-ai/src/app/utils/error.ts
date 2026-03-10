////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { TRPCClientError } from "@trpc/client";
import { ZodError } from "zod";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
// Types pour une meilleure gestion des erreurs
interface ErrorWithData {
  data?: {
    code?: string;
    message?: string;
    zodError?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
  };
}

interface NetworkError extends Error {
  code?: string;
  status?: number;
}
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export function handleError(error: unknown, defaultMessage?: string): string {
  // Log structuré pour debugging
  console.error("Error caught:", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Gestion des erreurs de session
  if (error instanceof TRPCClientError) {
    // Session invalide ou expirée
    if (error.data?.code === "UNAUTHORIZED") {
      // Notification à l'utilisateur
      toast.error("Votre session a expiré, vous allez être redirigé...");

      // Déconnexion et redirection
      void signOut({
        redirect: true,
        callbackUrl: "/auth",
      });

      return "Session expirée, redirection en cours...";
    }

    // Gestion des erreurs de rate limiting
    if (error.data?.code === "TOO_MANY_REQUESTS") {
      toast.error("Trop de requêtes, veuillez patienter...");
      return "Limite de requêtes atteinte, veuillez réessayer plus tard.";
    }

    // Gestion des erreurs de validation Zod
    if (error.data?.zodError) {
      if (error.data.zodError.fieldErrors) {
        return Object.values(error.data.zodError.fieldErrors).flat().join("\n");
      }

      if (error.data.zodError.formErrors) {
        return Object.values(error.data.zodError.formErrors).flat().join("\n");
      }
    }

    // Retourner directement le message d'erreur de l'API
    return error.message;
  }

  // Gestion des erreurs réseau
  if (error instanceof Error && "code" in error) {
    const networkError = error as NetworkError;

    switch (networkError.code) {
      case "NETWORK_ERROR":
        toast.error("Problème de connexion réseau");
        return "Erreur de connexion réseau, vérifiez votre connexion.";

      case "TIMEOUT":
        toast.error("La requête a pris trop de temps");
        return "Délai d'attente dépassé, veuillez réessayer.";

      case "ENOTFOUND":
        toast.error("Impossible de joindre le serveur");
        return "Serveur inaccessible, vérifiez votre connexion.";

      default:
        if (networkError.status) {
          switch (networkError.status) {
            case 500:
              toast.error("Erreur serveur");
              return "Erreur interne du serveur, veuillez réessayer plus tard.";
            case 502:
            case 503:
            case 504:
              toast.error("Service temporairement indisponible");
              return "Service temporairement indisponible, veuillez réessayer.";
            default:
              break;
          }
        }
        break;
    }
  }

  // Gestion des erreurs Zod directes
  if (error instanceof ZodError) {
    const fieldErrors = Object.values(error.flatten().fieldErrors)
      .flat()
      .join("\n");

    if (fieldErrors) {
      toast.error("Données invalides");
      return fieldErrors;
    }

    const formErrors = error.flatten().formErrors.join("\n");
    if (formErrors) {
      toast.error("Formulaire invalide");
      return formErrors;
    }
  }

  // Retourner le message d'erreur original
  if (error instanceof Error) {
    return error.message;
  }

  // Message par défaut uniquement si aucune erreur n'est détectée
  return (
    defaultMessage ?? "Une erreur s'est produite, merci de réessayer plus tard."
  );
}

// Fonction utilitaire pour vérifier si une erreur est liée à la session
export function isSessionError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED"
  );
}

// Fonction utilitaire pour vérifier si une erreur est liée au rate limiting
export function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError && error.data?.code === "TOO_MANY_REQUESTS"
  );
}

// Fonction utilitaire pour vérifier si une erreur est liée au réseau
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    ["NETWORK_ERROR", "TIMEOUT", "ENOTFOUND"].includes(
      (error as NetworkError).code || "",
    )
  );
}

export function handleTRPCForceLogout(error: unknown): boolean {
  // Gestion universelle de la déconnexion forcée
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    (error as ErrorWithData).data?.code === "UNAUTHORIZED" &&
    (error as ErrorWithData).data?.message === "FORCE_LOGOUT"
  ) {
    toast.error("Nouvelle session détectée, déconnexion...");
    // Utiliser signOut avec redirect: false puis redirection manuelle pour plus de fiabilité
    signOut({ redirect: false })
      .then(() => {
        window.location.href = "/auth";
      })
      .catch(() => {
        // Fallback si signOut échoue
        window.location.href = "/auth";
      });
    return true;
  }
  return false;
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
