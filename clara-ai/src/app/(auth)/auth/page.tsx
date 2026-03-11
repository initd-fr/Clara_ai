////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";

import {
  useState,
  useEffect,
  useCallback,
  memo,
  Suspense,
  lazy,
} from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { APP_CONFIG } from "~/app/config";
import { Logo } from "../../_components/Logo";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

// Composants lazy loaded pour optimiser le bundle
const ThemeToggle = lazy(() => import("./components/ThemeToggle"));
const LoginForm = lazy(() => import("./components/LoginForm"));
// Composant de skeleton loading
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
  </div>
));

const BackgroundWaves = memo(() => (
  <div className="absolute inset-0">
    <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
    <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
    <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
  </div>
));

// Optimisation des noms d'affichage
LoadingSkeleton.displayName = "LoadingSkeleton";
BackgroundWaves.displayName = "BackgroundWaves";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const searchParams = useSearchParams();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  // Optimisation des effets avec useCallback
  const initializeTheme = useCallback(() => {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      html.setAttribute("data-theme", savedTheme);
      setIsDark(savedTheme === "dark");
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      html.setAttribute("data-theme", systemDark ? "dark" : "light");
      setIsDark(systemDark);
      localStorage.setItem("theme", systemDark ? "dark" : "light");
    }
  }, []);

  const handleThemeChange = useCallback((e: MediaQueryListEvent) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      setIsDark(e.matches);
      localStorage.setItem("theme", newTheme);
    }
  }, []);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, [handleThemeChange]);
  ///////////////////////////////////////////////////////////////////////////////EFFECTS///////////////////////////////////////////////////////////////////////////////////////

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    const html = document.documentElement;

    html.setAttribute("data-theme", newTheme ? "dark" : "light");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    setIsDark(newTheme);
  }, [isDark]);

  // Optimisation des handlers avec useCallback et throttling
  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const login = await signIn("credentials", {
          email: loginEmail,
          password: loginPassword,
          redirect: false,
        });

        if (!login?.ok) {
          toast.error(
            login?.error || "Une erreur est survenue lors de la connexion",
          );
          return;
        }

        toast.success("Connecté avec succès !");
        window.location.href = searchParams.get("callbackUrl") ?? "/home";
      } catch (error) {
        console.error("Erreur de connexion:", error);
        toast.error("Une erreur est survenue lors de la connexion");
      } finally {
        setIsLoading(false);
      }
    },
    [loginEmail, loginPassword, searchParams],
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginEmail(e.target.value);
    },
    [],
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginPassword(e.target.value);
    },
    [],
  );

  const toggleLoginPassword = useCallback(() => {
    setShowLoginPassword(!showLoginPassword);
  }, [showLoginPassword]);

  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
      {/* Bouton de thème optimisé */}
      <Suspense
        fallback={
          <div className="absolute right-4 top-4 z-10 h-6 w-6 animate-pulse rounded bg-base-300/50" />
        }
      >
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </Suspense>

      {/* Vagues de fond optimisées */}
      <BackgroundWaves />

      {/* Carte principale - Ultra-optimisée */}
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl">
        <div className="flex h-full min-h-[600px] flex-col sm:min-h-[650px] md:min-h-[700px] lg:min-h-[750px]">
          {/* Logo et contenu */}
          <div className="flex h-full flex-col px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
            <Logo />

            {/* Formulaire de connexion */}
            <div className="mt-8 flex-1 sm:mt-10 md:mt-12">
              <Suspense fallback={<LoadingSkeleton />}>
                <LoginForm
                  loginEmail={loginEmail}
                  loginPassword={loginPassword}
                  showLoginPassword={showLoginPassword}
                  isLoading={isLoading}
                  isDark={isDark}
                  onEmailChange={handleEmailChange}
                  onPasswordChange={handlePasswordChange}
                  onTogglePassword={toggleLoginPassword}
                  onSubmit={handleLoginSubmit}
                />
              </Suspense>
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
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
}
