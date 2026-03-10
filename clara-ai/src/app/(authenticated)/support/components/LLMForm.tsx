"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import type { Provider, LLM } from "~/types/support";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface LLMFormProps {
  providers: Provider[];
  onSuccess: () => void;
  selectedLLM: LLM | null;
  onCancel: () => void;
}

interface FormData {
  value: string;
  label: string;
  text: string;
  className: string;
  provider: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  description: string;
  enabled: boolean;
  isDefault: boolean;
  availableSubscriptions: string[];
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const LLMForm = memo(
  ({ providers, onSuccess, selectedLLM, onCancel }: LLMFormProps) => {
    const [formData, setFormData] = useState<FormData>({
      value: "",
      label: "",
      text: "",
      className: "",
      provider: "",
      maxInputTokens: 0,
      maxOutputTokens: 0,
      description: "",
      enabled: true,
      isDefault: false,
      availableSubscriptions: [],
    });

    const createLLM = api.adminModels.create.useMutation();
    const updateLLM = api.adminModels.update.useMutation();

    // Récupérer les LLMs existants pour vérifier s'il y a déjà un LLM par défaut
    const { data: existingLLMs, refetch: refetchExistingLLMs } =
      api.adminModels.getAll.useQuery();

    // Vérifier s'il y a déjà un LLM par défaut
    const hasDefaultLLM = existingLLMs?.some((llm) => llm.isDefault) ?? false;

    // Désactiver l'option "Modèle par défaut" si un autre existe déjà et que ce n'est pas le LLM actuel
    const isDefaultDisabled =
      hasDefaultLLM && (!selectedLLM || !selectedLLM.llmIsDefault);

    const resetForm = useCallback(() => {
      setFormData({
        value: "",
        label: "",
        text: "",
        className: "",
        provider: "",
        maxInputTokens: 0,
        maxOutputTokens: 0,
        description: "",
        enabled: true,
        isDefault: false,
        availableSubscriptions: [],
      });
    }, []);

    const handleCancel = useCallback(() => {
      resetForm();
      onCancel();
    }, [onCancel, resetForm]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        try {
          if (selectedLLM) {
            await toast.promise(
              updateLLM.mutateAsync({
                id: selectedLLM.llmId,
                ...formData,
              }),
              {
                loading: "Mise à jour du LLM...",
                success: "LLM modifié avec succès !",
                error:
                  "Une erreur est survenue lors de la modification du LLM. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
              },
            );
          } else {
            await toast.promise(
              createLLM.mutateAsync({
                ...formData,
              }),
              {
                loading: "Création du LLM...",
                success: "LLM créé avec succès !",
                error:
                  "Une erreur est survenue lors de la création du LLM. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
              },
            );
          }

          // Rafraîchir les données des LLMs existants pour mettre à jour la logique du modèle par défaut
          await refetchExistingLLMs();
          onSuccess();
          if (!selectedLLM) {
            resetForm();
          }
        } catch (error) {
          console.error("Erreur lors de la soumission:", error);
          toast.error("Erreur lors de l'opération");
        }
      },
      [
        selectedLLM,
        formData,
        onSuccess,
        createLLM,
        updateLLM,
        resetForm,
        refetchExistingLLMs,
      ],
    );

    const providerOptions = useMemo(
      () =>
        providers.map((provider) => (
          <option key={provider.value} value={provider.value}>
            {provider.label}
          </option>
        )),
      [providers],
    );

    const handleSubscriptionChange = useCallback(
      (subscription: string, checked: boolean) => {
        setFormData((prev) => ({
          ...prev,
          availableSubscriptions: checked
            ? [...prev.availableSubscriptions, subscription]
            : prev.availableSubscriptions.filter((s) => s !== subscription),
        }));
      },
      [],
    );

    const subscriptionOptions = useMemo(() => [], []);

    // Mémoisation des classes CSS pour les performances
    const formClasses = useMemo(() => "space-y-6", []);
    const inputClasses = useMemo(
      () =>
        "input input-bordered w-full rounded-xl border-base-content/10 bg-base-100/50 text-base-content placeholder:text-base-content/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
      [],
    );
    const selectClasses = useMemo(
      () =>
        "select select-bordered w-full rounded-xl border-base-content/10 bg-base-100/50 text-base-content focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
      [],
    );
    const buttonClasses = useMemo(
      () => "btn btn-primary flex-1 rounded-xl",
      [],
    );
    const cancelButtonClasses = useMemo(() => "btn btn-ghost rounded-xl", []);

    useEffect(() => {
      if (selectedLLM) {
        setFormData({
          value: selectedLLM.llmValue,
          label: selectedLLM.llmLabel,
          text: selectedLLM.llmText,
          className: selectedLLM.llmClassName || "",
          provider: selectedLLM.provider,
          maxInputTokens: selectedLLM.llmMaxInputTokens,
          maxOutputTokens: selectedLLM.llmMaxOutputTokens,
          description: selectedLLM.description || "",
          enabled: selectedLLM.llmEnabled,
          isDefault: selectedLLM.llmIsDefault,
          availableSubscriptions: selectedLLM.availableSubscriptions,
        });
      } else {
        resetForm();
      }
    }, [selectedLLM, resetForm]);
    // ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <div className="space-y-6" role="form">
        <form
          className={formClasses}
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="llm-form-description"
        >
          <div id="llm-form-description" className="sr-only">
            Formulaire pour {selectedLLM ? "modifier" : "créer"} un modèle de
            langage
          </div>

          {/* Section des informations de base */}
          <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/50 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold text-base-content">
              Informations de base
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-control">
                <label className="label" htmlFor="llm-label">
                  <span className="label-text font-medium">Label</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      label: e.target.value.slice(0, 40),
                    })
                  }
                  maxLength={40}
                  placeholder="ex: GPT-4 Turbo"
                  required
                  name="label"
                  id="llm-label"
                  autoComplete="off"
                  aria-describedby="llm-label-help"
                />
                <div className="mt-1 text-right text-xs text-base-content/60">
                  {formData.label.length}/40 caractères
                </div>
                <div id="llm-label-help" className="sr-only">
                  Nom d&apos;affichage du modèle de langage
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="llm-value">
                  <span className="label-text font-medium">Valeur</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="ex: gpt-4-turbo-preview"
                  required
                  name="value"
                  id="llm-value"
                  autoComplete="off"
                  aria-describedby="llm-value-help"
                />
                <div id="llm-value-help" className="sr-only">
                  Identifiant technique du modèle
                </div>
              </div>

              {/* Provider */}
              <div className="form-control">
                <label className="label" htmlFor="llm-provider">
                  <span className="label-text">Provider</span>
                </label>
                <select
                  className={selectClasses}
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  required
                  name="provider"
                  id="llm-provider"
                  aria-describedby="llm-provider-help"
                >
                  <option value="">Sélectionner un provider</option>
                  {providerOptions}
                </select>
                <div id="llm-provider-help" className="sr-only">
                  Fournisseur du modèle de langage
                </div>
              </div>

              {/* Tokens */}
              <div className="form-control">
                <label className="label" htmlFor="llm-max-input">
                  <span className="label-text">Max Input Tokens</span>
                </label>
                <input
                  type="number"
                  className={inputClasses}
                  value={formData.maxInputTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxInputTokens: +e.target.value,
                    })
                  }
                  required
                  name="maxInputTokens"
                  id="llm-max-input"
                  min="0"
                  step="1"
                  aria-describedby="llm-max-input-help"
                />
                <div id="llm-max-input-help" className="sr-only">
                  Nombre maximum de tokens en entrée
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="llm-max-output">
                  <span className="label-text">Max Output Tokens</span>
                </label>
                <input
                  type="number"
                  className={inputClasses}
                  value={formData.maxOutputTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOutputTokens: +e.target.value,
                    })
                  }
                  required
                  name="maxOutputTokens"
                  id="llm-max-output"
                  min="0"
                  step="1"
                  aria-describedby="llm-max-output-help"
                />
                <div id="llm-max-output-help" className="sr-only">
                  Nombre maximum de tokens en sortie
                </div>
              </div>

              {/* Modèle par défaut */}
              <div className="col-span-full">
                <div className="form-control">
                  <label
                    className={clsx(
                      "label cursor-pointer",
                      isDefaultDisabled && "opacity-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isDefault: e.target.checked,
                        }))
                      }
                      disabled={isDefaultDisabled}
                      name="isDefault"
                      aria-describedby="isDefault-help"
                    />
                    <span className="label-text ml-2">
                      Modèle par défaut
                      {isDefaultDisabled && (
                        <span className="ml-2 text-xs text-warning">
                          (Un autre modèle est déjà par défaut)
                        </span>
                      )}
                    </span>
                  </label>
                  <div id="isDefault-help" className="sr-only">
                    Définir ce modèle comme modèle par défaut pour les
                    migrations automatiques
                  </div>
                </div>
              </div>

              {/* Abonnements */}
              <div className="col-span-full">
                <label className="label">
                  <span className="label-text">Abonnements disponibles</span>
                </label>
                <div
                  className="flex flex-wrap gap-4"
                  role="group"
                  aria-labelledby="subscriptions-label"
                >
                  <div id="subscriptions-label" className="sr-only">
                    Sélection des abonnements pour ce modèle
                  </div>
                  {subscriptionOptions}
                </div>
              </div>
            </div>
          </div>

          {/* Section des actions */}
          <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-gradient-to-r from-primary/5 to-primary/10 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold text-base-content">
              Actions
            </h3>
            <div className="flex gap-4">
              <button
                type="submit"
                className={buttonClasses}
                disabled={createLLM.isPending || updateLLM.isPending}
                aria-label={selectedLLM ? "Modifier le LLM" : "Créer le LLM"}
              >
                {createLLM.isPending || updateLLM.isPending ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="loading loading-spinner loading-sm"
                      aria-hidden="true"
                    />
                    <span>
                      {selectedLLM ? "Modification..." : "Création..."}
                    </span>
                  </div>
                ) : selectedLLM ? (
                  "Modifier le LLM"
                ) : (
                  "Créer le LLM"
                )}
              </button>
              {selectedLLM ? (
                <button
                  type="button"
                  className={cancelButtonClasses}
                  onClick={handleCancel}
                  aria-label="Annuler la modification"
                >
                  Annuler
                </button>
              ) : (
                <button
                  type="button"
                  className={cancelButtonClasses}
                  onClick={resetForm}
                  aria-label="Réinitialiser le formulaire"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);

LLMForm.displayName = "LLMForm";

export { LLMForm };
