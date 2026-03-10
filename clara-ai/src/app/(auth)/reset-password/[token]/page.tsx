"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { api } from "~/trpc/react";
import { APP_CONFIG } from "~/app/config";
import ThemeToggle from "../ThemeToggle";
import { Logo } from "../../../_components/Logo";
import SecondaryLoader from "~/components/SecondaryLoader";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

export default function ResetPasswordWithTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const token = params.token;
  // ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation du token
  const { data: tokenValidation, isLoading: isLoadingToken } =
    api.user.validateResetToken.useQuery(
      { token: token || "" },
      {
        enabled: !!token,
        retry: false,
      },
    );

  // Mutation pour réinitialiser le mot de passe
  const resetPasswordMutation = api.user.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Votre mot de passe a été réinitialisé avec succès !");
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la réinitialisation du mot de passe",
      );
    },
  });

  // Rediriger si pas de token
  useEffect(() => {
    if (!token) {
      router.push("/reset-password");
    }
  }, [token, router]);

  // Rediriger si token invalide
  useEffect(() => {
    if (tokenValidation && !tokenValidation.valid) {
      toast.error("Lien de réinitialisation invalide ou expiré");
      router.push("/reset-password");
    }
  }, [tokenValidation, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return toast.error("Token manquant");
    }

    if (password !== confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas");
    }

    if (password.length < 12) {
      return toast.error(
        "Le mot de passe doit contenir au moins 12 caractères",
      );
    }

    // Validation regex du mot de passe
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
      );
    }

    resetPasswordMutation.mutate({ token, newPassword: password });
  };
  // ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  if (isLoadingToken) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
        <ThemeToggle />

        {/* Vagues de fond */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
          <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
          <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
        </div>

        {/* Carte principale responsive */}
        <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="flex h-full flex-col px-6 py-8 sm:px-8 md:px-10 md:py-12">
            {/* Logo */}
            <div className="text-center">
              <Logo />
            </div>

            {/* Contenu principal avec flex */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-base-content">
                  Validation du lien
                </h2>
                <p className="mt-2 text-sm text-base-content/60">
                  Vérification de votre lien de réinitialisation...
                </p>
              </div>
              <div
                className="mt-12 flex flex-col items-center justify-center"
                aria-live="polite"
              >
                <SecondaryLoader size="lg" />
                <p className="mt-4 text-base-content/70">
                  Validation en cours...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return null; // Redirection en cours
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
      <ThemeToggle />

      {/* Vagues de fond */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
        <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
        <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
      </div>

      {/* Carte principale responsive */}
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex h-full flex-col px-6 py-8 sm:px-8 md:px-10 md:py-12">
          {/* Logo */}
          <div className="text-center">
            <Logo />
          </div>

          {/* Contenu principal avec flex */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-medium text-base-content">
                Nouveau mot de passe
              </h2>
              <p className="mt-2 text-sm text-base-content/60">
                Bonjour {tokenValidation.user?.firstName}, entrez votre nouveau
                mot de passe
              </p>
            </div>

            {isSuccess ? (
              <div className="mt-12 text-center" aria-live="polite">
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-lg font-medium">
                    Mot de passe réinitialisé !
                  </span>
                </div>
                <p className="mt-4 text-base-content/70">
                  Vous allez être redirigé vers la page de connexion...
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-12 space-y-6"
                noValidate
              >
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input h-14 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 pr-12 text-base-content outline-none ring-0 placeholder:text-base-content/50 focus:border-base-content/10 focus:outline-none focus:ring-0"
                      placeholder="Nouveau mot de passe"
                      required
                      disabled={resetPasswordMutation.isPending}
                      name="newPassword"
                      maxLength={40}
                      autoComplete="new-password"
                      aria-label="Nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-base-content/50 hover:text-base-content/70"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input h-14 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 pr-12 text-base-content outline-none ring-0 placeholder:text-base-content/50 focus:border-base-content/10 focus:outline-none focus:ring-0"
                      placeholder="Confirmer le mot de passe"
                      required
                      disabled={resetPasswordMutation.isPending}
                      name="confirmPassword"
                      maxLength={40}
                      autoComplete="new-password"
                      aria-label="Confirmer le mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-base-content/50 hover:text-base-content/70"
                      aria-label={
                        showConfirmPassword
                          ? "Masquer la confirmation du mot de passe"
                          : "Afficher la confirmation du mot de passe"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className="rounded-xl border border-info/20 bg-info/10 p-4"
                  id="password-reqs"
                >
                  <p className="text-sm text-info-content">
                    <strong>Le mot de passe doit contenir :</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-info-content/80">
                    <li>• Au moins 12 caractères</li>
                    <li>• Au moins une majuscule</li>
                    <li>• Au moins une minuscule</li>
                    <li>• Au moins un chiffre</li>
                    <li>• Au moins un caractère spécial (@$!%*?&)</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <Link
                    href="/auth"
                    className={`btn h-14 rounded-xl bg-base-200/30 px-6 font-medium shadow-sm transition-all hover:bg-base-200/50 hover:shadow-base-content/20 ${
                      isDark ? "" : "border border-base-content/10"
                    }`}
                    aria-label="Retour à la connexion"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Retour
                  </Link>
                  <button
                    type="submit"
                    className="btn h-14 rounded-xl bg-primary px-6 font-medium text-primary-content shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={resetPasswordMutation.isPending}
                    aria-describedby="password-reqs"
                  >
                    {resetPasswordMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm" />
                        <span>Réinitialisation...</span>
                      </div>
                    ) : (
                      "Réinitialiser le mot de passe"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="border-t border-base-content/10 p-4 text-center text-sm text-base-content/60">
          {APP_CONFIG.version} © {APP_CONFIG.year} Clara AI
        </div>
      </div>
    </div>
    //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
