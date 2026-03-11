"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { LogOutIcon, SettingsIcon, HeadphonesIcon } from "lucide-react";
import { useAppSession } from "~/context/SessionContext";
import { signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface DockIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
}

interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const dockVariants = cva(
  "flex items-center justify-center gap-6 rounded-xl bg-base-200/50 backdrop-blur-md p-2",
);
/////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////TODO THEME TOGGLE///////////////////////////////////////////////////////////////////////////////////////
const ThemeToggle = memo(() => {
  const [isDark, setIsDark] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Gestion de l'hydratation pour éviter les erreurs SSR
  useEffect(() => {
    setIsHydrated(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setIsDark(systemDark);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

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
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        setIsDark(e.matches);
        localStorage.setItem("theme", newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isHydrated]);

  const toggleTheme = useCallback(() => {
    if (!isHydrated) return;

    const newTheme = !isDark;
    const html = document.documentElement;

    html.setAttribute("data-theme", newTheme ? "dark" : "light");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    setIsDark(newTheme);
  }, [isDark, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="swap swap-rotate">
        <div className="h-6 w-6 animate-pulse rounded bg-base-300" />
      </div>
    );
  }

  return (
    <label
      className="swap swap-rotate"
      aria-label="Basculer entre le thème clair et sombre"
      data-tour="theme-button"
    >
      <input
        type="checkbox"
        className="theme-controller"
        onChange={toggleTheme}
        checked={isDark}
        aria-label="Sélecteur de thème"
      />
      {/* sun icon */}
      <svg
        className="swap-off h-6 w-6 fill-current group-hover:text-primary-content"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
      >
        <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
      </svg>
      {/* moon icon */}
      <svg
        className="swap-on h-6 w-6 fill-current group-hover:text-primary-content"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
      >
        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
      </svg>
    </label>
  );
});
/////////////////////////////////////////////////////////////////////////////////TODO END THEME TOGGLE///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TODO DOCK ICON///////////////////////////////////////////////////////////////////////////////////////
const DockIcon = memo(({ icon, label, onClick }: DockIconProps) => {
  const getDataTour = () => {
    if (label === "Paramètres") return "settings-button";
    if (label === "Déconnexion") return "logout-button";
    return undefined;
  };

  return (
    <motion.button
      onClick={onClick}
      data-tour={getDataTour()}
      className="group relative flex h-11 w-11 items-center justify-center rounded-lg bg-base-300/50 p-2 text-base-content transition-all duration-150 hover:-translate-y-1 hover:bg-primary hover:text-primary-content"
      aria-label={label}
      title={label}
    >
      {icon}
    </motion.button>
  );
});
/////////////////////////////////////////////////////////////////////////////////TODO END DOCK ICON///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TODO DOCK///////////////////////////////////////////////////////////////////////////////////////
export const Dock = memo(({ className }: DockProps) => {
  const { user } = useAppSession();
  const router = useRouter();
  const logoutMutation = api.auth.logout.useMutation();

  // ~  ///////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  const handleLogout = useCallback(async () => {
    try {
      // Toast explicite pour la déconnexion volontaire
      toast.success("Déconnexion réussie !");
      // Déconnexion via tRPC
      await logoutMutation.mutateAsync();

      // Déconnexion via NextAuth
      await signOut({
        callbackUrl: "/auth",
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  }, [logoutMutation]);

  const handleSettingsClick = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleSupportClick = useCallback(() => {
    router.push("/support");
  }, [router]);
  // ~  ///////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

  // ~  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const items = useMemo(
    (): DockItem[] => [
      {
        icon: <ThemeToggle />,
        label: "Thème",
      },
      {
        icon: <SettingsIcon className="h-6 w-6" />,
        label: "Paramètres",
        onClick: handleSettingsClick,
      },
      {
        icon: <HeadphonesIcon className="h-6 w-6" />,
        label: "Support",
        onClick: handleSupportClick,
      },
      {
        icon: <LogOutIcon className="h-6 w-6" />,
        label: "Déconnexion",
        onClick: handleLogout,
      },
    ],
    [handleSettingsClick, handleSupportClick, handleLogout],
  );
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div
      className={cn(dockVariants({ className }))}
      role="toolbar"
      aria-label="Barre d'outils de navigation"
    >
      {items.map((item, index) => (
        <DockIcon
          key={`${item.label}-${index}`}
          icon={item.icon}
          label={item.label}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
});
/////////////////////////////////////////////////////////////////////////////////TODO END DOCK///////////////////////////////////////////////////////////////////////////////////////

ThemeToggle.displayName = "ThemeToggle";
DockIcon.displayName = "DockIcon";
Dock.displayName = "Dock";
