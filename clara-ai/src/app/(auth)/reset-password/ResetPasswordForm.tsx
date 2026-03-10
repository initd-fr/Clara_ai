////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";
import { useRef, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "~/trpc/react";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function ResetPasswordForm() {
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [isDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [isSuccess, setIsSuccess] = useState(false);

  // Mutation tRPC pour la demande de réinitialisation
  const requestPasswordResetMutation =
    api.user.requestPasswordReset.useMutation({
      onSuccess: (data) => {
        if (data.success) {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 5000);
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      },
      onError: (error) => {
        toast.error(
          error.message ||
            "Erreur lors de l'envoi de l'email de réinitialisation",
        );
      },
    });
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!emailInputRef.current) {
        return toast.error("Aucun email fourni.");
      }

      const email = emailInputRef.current.value;

      // Validation basique de l'email
      if (!email || !email.includes("@")) {
        return toast.error("Veuillez entrer une adresse email valide.");
      }

      // Appel de la mutation
      requestPasswordResetMutation.mutate({ email });
    },
    [requestPasswordResetMutation],
  );

  // Styles mémorisés pour les performances
  const buttonStyle = useMemo(() => {
    const baseStyle =
      "btn h-14 rounded-xl px-6 font-medium text-primary-content shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30";
    const successStyle = "bg-success shadow-success/20 hover:shadow-success/30";
    const primaryStyle = "bg-primary hover:bg-primary/90";
    const disabledStyle = "cursor-not-allowed opacity-60";

    return `${baseStyle} ${
      isSuccess ? successStyle : primaryStyle
    } ${requestPasswordResetMutation.isPending ? disabledStyle : ""}`;
  }, [isSuccess, requestPasswordResetMutation.isPending]);

  const linkStyle = useMemo(() => {
    const baseStyle =
      "btn h-14 rounded-xl bg-base-200/30 px-6 font-medium shadow-sm transition-all hover:bg-base-200/50 hover:shadow-base-content/20";
    return `${baseStyle} ${isDark ? "" : "border border-base-content/10"}`;
  }, [isDark]);
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <input
          ref={emailInputRef}
          type="email"
          className="input h-14 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 text-base-content outline-none ring-0 placeholder:text-base-content/50 focus:border-base-content/10 focus:outline-none focus:ring-0"
          placeholder="E-mail"
          required
          disabled={requestPasswordResetMutation.isPending}
          aria-label="Adresse email pour réinitialisation"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/auth"
          className={linkStyle}
          aria-label="Retour à la page de connexion"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Link>
        <button
          type="submit"
          className={buttonStyle}
          disabled={requestPasswordResetMutation.isPending}
          aria-label="Envoyer l'email de réinitialisation"
        >
          {requestPasswordResetMutation.isPending ? (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm" />
              <span>Envoi en cours...</span>
            </div>
          ) : isSuccess ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Email envoyé !</span>
            </div>
          ) : (
            "Réinitialiser"
          )}
        </button>
      </div>
    </form>
    ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
