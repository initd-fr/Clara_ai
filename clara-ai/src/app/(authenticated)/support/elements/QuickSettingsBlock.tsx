"use client";
// ~ IMPORTS
import { useMemo } from "react";
import { api } from "~/trpc/react";
import { Zap, Target, Gauge, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
// ~ IMPORTS

// ? TYPES
const RAG_OPTIONS = [
  {
    value: "0.5",
    label: "Strict",
    description: "Seuls les passages très proches",
    icon: Target,
    colorClass:
      "from-error/20 to-error/10 border-error/30 text-error hover:from-error/30 hover:to-error/20",
    activeClass: "ring-2 ring-error shadow-lg shadow-error/20",
  },
  {
    value: "0.85",
    label: "Normal",
    description: "Équilibre précision / rappel",
    icon: Gauge,
    colorClass:
      "from-primary/20 to-primary/10 border-primary/30 text-primary hover:from-primary/30 hover:to-primary/20",
    activeClass: "ring-2 ring-primary shadow-lg shadow-primary/20",
  },
  {
    value: "1.0",
    label: "Permissif",
    description: "Plus de contexte inclus",
    icon: Zap,
    colorClass:
      "from-success/20 to-success/10 border-success/30 text-success hover:from-success/30 hover:to-success/20",
    activeClass: "ring-2 ring-success shadow-lg shadow-success/20",
  },
] as const;

type QuickSettingsBlockProps = {
  speedCreateValue: string;
  ragThresholdValue: string;
  onRefresh: () => void;
};
// ? TYPES

// * COMPONENT
export function QuickSettingsBlock({
  speedCreateValue,
  ragThresholdValue,
  onRefresh,
}: QuickSettingsBlockProps) {
  const { data: modelsByProvider } = api.availableModels.getFiltred.useQuery();
  const updateSetting = api.settings.update.useMutation({
    onSuccess: () => {
      onRefresh();
      toast.success("Paramètre enregistré");
    },
    onError: (e) => {
      toast.error(e.message ?? "Erreur lors de l'enregistrement");
    },
  });

  const llmOptions = useMemo(() => {
    if (!modelsByProvider) return [];
    const options = Object.entries(modelsByProvider).flatMap(
      ([providerKey, data]) =>
        (data.models ?? []).map(
          (m: { llmValue: string; llmLabel: string }) => ({
            value: m.llmValue,
            label: `${data.providerLabel ?? providerKey} – ${m.llmLabel}`,
          }),
        ),
    );
    if (
      speedCreateValue &&
      !options.some((o) => o.value === speedCreateValue)
    ) {
      options.unshift({
        value: speedCreateValue,
        label: `${speedCreateValue} (non disponible)`,
      });
    }
    return options;
  }, [modelsByProvider, speedCreateValue]);

  const handleSpeedCreateChange = (value: string) => {
    updateSetting.mutate({ key: "SpeedCreate_DefaultModel", value });
  };

  const handleRagThresholdChange = (value: string) => {
    updateSetting.mutate({ key: "RAG_SimilarityThreshold", value });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg">
      <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-xl" />
      <div className="relative z-10 space-y-6">
        <h3 className="flex items-center gap-2 text-xl font-bold text-base-content">
          <Zap className="h-5 w-5 text-primary" />
          Paramètres rapides
        </h3>

        {/* Speed Create - Modèle par défaut */}
        <div className="space-y-5">
          <div className="flex items-center gap-5">
            <label
              htmlFor="speed-create-model"
              className="text-sm font-medium text-base-content/80"
            >
              Modèle par défaut (Speed Create)
            </label>
            <select
              id="speed-create-model"
              value={speedCreateValue}
              onChange={(e) => handleSpeedCreateChange(e.target.value)}
              disabled={updateSetting.isPending}
              className="select select-bordered w-full max-w-md rounded-xl bg-base-100 font-medium"
              aria-label="Choisir le modèle LLM par défaut pour la création rapide"
            >
              {llmOptions.length === 0 ? (
                <option value="">Aucun modèle configuré</option>
              ) : (
                llmOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="text-xs text-base-content/60">
            Modèle utilisé pour la création rapide d&apos;agents et
            d&apos;experts.
          </p>
        </div>

        {/* Seuil de similarité RAG */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-base-content/80">
            Seuil de similarité RAG
          </span>
          <p className="text-xs text-base-content/60">
            Plus le seuil est bas, plus seuls les passages très similaires à la
            question sont gardés.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {RAG_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive =
                String(ragThresholdValue) === opt.value ||
                (opt.value === "0.85" && !ragThresholdValue);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRagThresholdChange(opt.value)}
                  disabled={updateSetting.isPending}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-gradient-to-br p-4 text-center transition-all ${opt.colorClass} ${isActive ? opt.activeClass : ""}`}
                  aria-pressed={isActive}
                  aria-label={`Seuil ${opt.label} : ${opt.description}`}
                >
                  <Icon className="h-8 w-8 shrink-0" />
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-90">{opt.description}</span>
                  {isActive && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
