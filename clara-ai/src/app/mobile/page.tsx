"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Smartphone, Sun, Moon } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { Logo } from "../_components/Logo";
import { APP_CONFIG } from "~/app/config";
export default function MobilePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Gestion du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = savedTheme || (systemDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }, [theme]);

  const handleGoHome = useCallback(() => {
    try {
      router.push("/");
    } catch (error) {
      // Fallback en cas d'erreur de navigation
      window.location.href = "/";
    }
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base-100"
      role="main"
      aria-label="Application mobile en développement"
    >
      {/* Toggle de thème en haut à droite */}
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-20 rounded-full bg-base-200/50 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Changer le thème"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-base-content" />
        ) : (
          <Sun className="h-5 w-5 text-base-content" />
        )}
      </button>

      {/* Vagues de fond optimisées */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 blur-2xl" />
        <div className="from-primary/8 to-secondary/8 absolute -left-24 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br blur-xl" />
        <div className="from-secondary/8 to-accent/8 absolute -right-24 top-48 h-[300px] w-[300px] rounded-full bg-gradient-to-br blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center sm:gap-12 md:gap-16 lg:gap-20">
        {/* Logo officiel Clara AI */}
        <Logo />

        {/* Content avec design asymétrique */}
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16">
          <div className="relative">
            {/* Cercles décoratifs optimisés */}
            <div className="absolute -left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-primary/15 sm:-left-12 sm:h-24 sm:w-24 md:h-32 md:w-32" />
            <div className="absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-secondary/15 sm:-right-12 sm:h-24 sm:w-24 md:h-32 md:w-32" />

            {/* Icône mobile avec style unique */}
            <div className="relative flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm sm:h-32 sm:w-32 md:h-40 md:w-40">
                <Smartphone className="h-12 w-12 animate-pulse text-primary sm:h-16 sm:w-16 md:h-20 md:w-20" />
              </div>
              <div className="absolute -bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/40 to-secondary/40 sm:-bottom-3 sm:w-16 md:w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="text-xl font-medium text-base-content sm:text-2xl md:text-3xl">
              Application Mobile
            </h3>
            <p className="max-w-sm text-sm text-base-content/60 sm:max-w-md sm:text-base">
              Notre application mobile arrive bientôt !
            </p>
            <p className="max-w-sm text-sm text-base-content/60 sm:max-w-md sm:text-base">
              En attendant, vous pouvez utiliser Clara AI sur votre ordinateur
              pour une expérience optimale.
            </p>
          </div>

          {/* Bouton avec design moderne et accessibilité */}
          <button
            onClick={handleGoHome}
            className="group relative flex items-center gap-2 rounded-2xl bg-base-200 px-4 py-2 text-base-content transition-all duration-300 hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:gap-3 sm:px-6 sm:py-3 md:px-8 md:py-4"
            aria-label="Accéder à la version web"
          >
            <span className="text-sm font-medium sm:text-base">
              Accéder à la version web
            </span>
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </button>

          {/* Footer avec informations */}
          <div className="text-center text-xs text-base-content/50 sm:text-sm">
            <p>
              {APP_CONFIG.version} © {APP_CONFIG.year} Clara AI
            </p>
            <p className="mt-1">Optimisé pour les écrans de bureau</p>
          </div>
        </div>
      </div>
    </div>
  );
}
