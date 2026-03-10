"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useEffect, memo, useCallback } from "react";
import Image from "next/image";
// Import statique des images pour l'optimisation Next.js
import LogoDark from "/public/LogoClara_Dark.webp";
import LogoLight from "/public/LogoClara_light.webp";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export const Logo = memo(() => {
  ////////////////////////////////////////////////////////////////////////////////STATE///////////////////////////////////////////////////////////////////////////////////////
  const [theme, setTheme] = useState<"light" | "dark">("light");
  ////////////////////////////////////////////////////////////////////////////////STATE///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const updateTheme = useCallback(() => {
    try {
      const currentTheme =
        (document.documentElement.getAttribute("data-theme") as
          | "light"
          | "dark") || "light";
      setTheme(currentTheme);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du thème:", error);
      setTheme("light"); // Fallback en cas d'erreur
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialisation du thème
      updateTheme();

      // Observer les changements de thème
      const observer = new MutationObserver(() => {
        updateTheme();
      });

      try {
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });
      } catch (error) {
        console.error("Erreur lors de l'observation du thème:", error);
      }

      return () => {
        try {
          observer.disconnect();
        } catch (error) {
          console.error("Erreur lors de la déconnexion de l'observer:", error);
        }
      };
    }
  }, [updateTheme]);
  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <h1 className="mb-8 text-center sm:mb-10 md:mb-12">
      <div className="flex flex-col items-center">
        {/* Conteneur du logo avec contraintes strictes */}
        <div className="auth-logo-container flex h-[80px] w-full max-w-[300px] flex-row items-center justify-center sm:h-[90px] md:h-[100px] md:max-w-[350px]">
          {theme === "dark" ? (
            <Image
              src={LogoDark}
              alt="Logo Clara AI - Thème sombre"
              priority
              className="auth-logo-image h-full max-h-full w-auto max-w-full object-contain"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                height: "auto",
                width: "auto",
              }}
              onError={(e) => {
                console.error("Erreur lors du chargement du logo dark:", e);
                // Fallback vers le logo light en cas d'erreur
                const target = e.target as HTMLImageElement;
                target.src = "/LogoClara_light.webp";
              }}
            />
          ) : (
            <Image
              src={LogoLight}
              alt="Logo Clara AI - Thème clair"
              priority
              className="auth-logo-image h-full max-h-full w-auto max-w-full object-contain"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                height: "auto",
                width: "auto",
              }}
              onError={(e) => {
                console.error("Erreur lors du chargement du logo light:", e);
                // Fallback vers le logo dark en cas d'erreur
                const target = e.target as HTMLImageElement;
                target.src = "/LogoClara_Dark.webp";
              }}
            />
          )}
        </div>
        {/* Ligne drapeau français juste sous le logo avec contraintes */}
        <div
          className="-mt-3 h-1 w-48 rounded-full sm:w-56 md:w-60"
          style={{
            background:
              "linear-gradient(90deg, #0055A4 0%, #0055A4 33.33%, #fff 33.33%, #fff 66.66%, #EF4135 66.66%, #EF4135 100%)",
            maxWidth: "100%",
          }}
          role="img"
          aria-label="Drapeau français"
        />
      </div>
    </h1>
    ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
});
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

Logo.displayName = "Logo";
