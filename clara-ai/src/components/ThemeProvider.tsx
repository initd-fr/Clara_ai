"use client";
import { useEffect, useState, memo, useCallback } from "react";

const ThemeProvider = memo(function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const applyTheme = useCallback((theme: string) => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Erreur lors de l'application du thème:", error);
      // Fallback vers le thème light en cas d'erreur
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initialTheme = savedTheme || (systemDark ? "dark" : "light");

      applyTheme(initialTheme);
      setIsThemeLoaded(true);
    } catch (error) {
      console.error("Erreur lors de l'initialisation du thème:", error);
      // Fallback vers le thème light
      applyTheme("light");
      setIsThemeLoaded(true);
    }
  }, [applyTheme]);

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Ne changer que si aucun thème n'est sauvegardé
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        const newTheme = e.matches ? "dark" : "light";
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [applyTheme]);

  if (!isThemeLoaded) {
    return null;
  }

  return <>{children}</>;
});

export default ThemeProvider;
