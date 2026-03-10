"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useCallback, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Brain, Zap, Settings2, ArrowLeft } from "lucide-react";
import { cn } from "~/lib/utils";
import CloseButton from "~/components/ui/CloseButton";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type ChooseModeModalProps = {
  onClose: () => void;
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme");
          setIsDark(theme === "dark");
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
};
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const ChooseModeModal = memo(function ChooseModeModal({ onClose }: ChooseModeModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDark = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMode, setSelectedMode] = useState<"agent" | "expert" | null>(null);

  const openSpeedCreate = useCallback(
    (mode: "agent" | "expert") => {
      const params = new URLSearchParams(searchParams);
      params.set("modal", "speed-create");
      params.set("mode", mode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openSetModel = useCallback(
    (mode: "agent" | "expert") => {
      const params = new URLSearchParams(searchParams);
      params.set("modal", "set-model");
      params.set("type", "solo");
      params.set("mode", mode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const goBack = useCallback(() => {
    setStep(1);
    setSelectedMode(null);
  }, []);

  const handleSelectType = useCallback((mode: "agent" | "expert") => {
    setSelectedMode(mode);
    setStep(2);
  }, []);

  const labelMode = selectedMode === "agent" ? "Agent" : "Expert";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-base-100/95 shadow-2xl backdrop-blur-xl">
      {/* Header avec gradient Clara */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#25f5ef]/10 via-[#931975]/20 to-[#580744]/30 px-4 py-6 shadow-lg dark:from-[#25f5ef]/5 dark:via-[#931975]/10 dark:to-[#580744]/20 sm:px-6">
        <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-15">
          <div className="absolute left-[5%] top-[10%] h-16 w-16 rounded-full bg-[#25f5ef] blur-xl" />
          <div className="absolute right-[15%] top-[30%] h-24 w-24 rounded-full bg-[#931975] blur-xl" />
          <div className="absolute bottom-[20%] left-[25%] h-20 w-20 rounded-full bg-[#580744] blur-xl" />
          <div className="absolute bottom-[10%] right-[10%] h-12 w-12 rounded-full bg-[#125eb4] blur-xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Emplacement fixe pour la flèche retour : même largeur step 1 et 2, pas de décalage du titre */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {step === 2 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-content/10 bg-base-100/80 text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
                  aria-label="Retour"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="title-medium text-2xl text-base-content">
                Créer un modèle
              </h3>
              <p className="mt-1 text-base text-base-content/70">
                {step === 1
                  ? "Choisissez le type de modèle"
                  : `Mode ${labelMode} · Choisissez le type de création`}
              </p>
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              onClick={() => handleSelectType("agent")}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 sm:p-6"
            >
              <div
                className={cn(
                  "absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 to-transparent",
                  isDark ? "via-secondary/10" : "via-primary/10",
                )}
              />
              <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-emerald-500 transition-all duration-200 group-hover:scale-110 group-hover:text-emerald-600 sm:h-20 sm:w-20",
                    isDark ? "bg-emerald-500/10" : "bg-emerald-500/20",
                  )}
                >
                  <Sparkles className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="text-center">
                  <h4 className="title-medium text-xl text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                    Agent IA
                  </h4>
                  <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content">
                    Un agent conversationnel qui répond à vos questions.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType("expert")}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 sm:p-6"
            >
              <div
                className={cn(
                  "absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 to-transparent",
                  isDark ? "via-secondary/10" : "via-primary/10",
                )}
              />
              <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-violet-500 transition-all duration-200 group-hover:scale-110 group-hover:text-violet-600 sm:h-20 sm:w-20",
                    isDark ? "bg-violet-500/10" : "bg-violet-500/20",
                  )}
                >
                  <Brain className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="text-center">
                  <h4 className="title-medium text-xl text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                    Expert
                  </h4>
                  <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content">
                    Un assistant avec vos documents pour des réponses précises.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 2 && selectedMode && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              onClick={() => openSpeedCreate(selectedMode)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 sm:p-6"
            >
              <div
                className={cn(
                  "absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 to-transparent",
                  isDark ? "via-secondary/10" : "via-primary/10",
                )}
              />
              <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-amber-500 transition-all duration-200 group-hover:scale-110 group-hover:text-amber-600 sm:h-20 sm:w-20",
                    isDark ? "bg-amber-500/10" : "bg-amber-500/20",
                  )}
                >
                  <Zap className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="text-center">
                  <h4 className="title-medium text-xl text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                    Création rapide
                  </h4>
                  <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content">
                    Créez en quelques messages, sans formulaire. Idéal pour
                    démarrer vite.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openSetModel(selectedMode)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 sm:p-6"
            >
              <div
                className={cn(
                  "absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 to-transparent",
                  isDark ? "via-secondary/10" : "via-primary/10",
                )}
              />
              <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-blue-500 transition-all duration-200 group-hover:scale-110 group-hover:text-blue-600 sm:h-20 sm:w-20",
                    isDark ? "bg-blue-500/10" : "bg-blue-500/20",
                  )}
                >
                  <Settings2 className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="text-center">
                  <h4 className="title-medium text-xl text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                    Création avancée
                  </h4>
                  <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content">
                    Formulaire complet : nom, prompt, fournisseur, température
                    et options détaillées.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChooseModeModal;
