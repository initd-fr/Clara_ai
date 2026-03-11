"use client";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  Server,
} from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { cn } from "~/lib/utils";
import toast from "react-hot-toast";
import SecondaryLoader from "~/components/SecondaryLoader";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type ProviderWithText = {
  id: number;
  value: string;
  label: string;
  text: string;
  enabled: boolean;
};

type NewProvider = Omit<ProviderWithText, "id" | "enabled">;

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// --- ConfirmDeleteModal ---
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) => (
  <Dialog as="div" className="relative z-50" open={isOpen} onClose={onClose}>
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <DialogPanel className="relative w-full overflow-hidden rounded-2xl border border-base-300/50 bg-base-100/95 shadow-xl backdrop-blur-xl">
            {/* Header moderne avec gradient rouge */}
            <div className="relative overflow-hidden bg-gradient-to-r from-error/20 via-error/10 to-red-500/20 p-8">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-error/30 to-red-500/30 blur-xl" />
              <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-red-500/40 to-error/40 blur-lg" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-error/30 to-error/20">
                    <AlertTriangle className="h-6 w-6 text-error" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-base-content">
                      Supprimer le Provider
                    </DialogTitle>
                    <p className="text-base-content/70">
                      Cette action est irréversible et permanente
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base-content/60 transition-all duration-200 hover:scale-105 hover:bg-base-content/10 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="button"
                  style={{ pointerEvents: "auto" }}
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Avertissement */}
                <div className="rounded-lg border border-error/20 bg-error/5 p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="mt-1 h-5 w-5 text-error" />
                    <div>
                      <h3 className="text-lg font-semibold text-error">
                        Attention !
                      </h3>
                      <p className="mt-2 text-base-content/80">
                        Vous êtes sur le point de supprimer définitivement ce
                        provider. Cette action ne peut pas être annulée et aura
                        les conséquences suivantes :
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-base-content/70">
                        <li className="flex items-start gap-2">
                          <span className="text-error">•</span>
                          <span>
                            Tous les modèles associés à ce provider seront
                            désactivés
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-error">•</span>
                          <span>
                            Les utilisateurs ne pourront plus utiliser ces
                            modèles
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={onClose}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md"
                  >
                    <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                    <span className="relative z-10 font-medium">Annuler</span>
                  </button>

                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-error/20 to-error/10 px-6 py-3 text-error ring-1 ring-error/20 transition-all hover:from-error/30 hover:to-error/20 hover:shadow-lg"
                  >
                    <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                    <div className="relative z-10 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">
                        Supprimer définitivement
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </div>
  </Dialog>
);
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

export default function ProviderManagement() {
  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderWithText | null>(null);
  const [initialEditData, setInitialEditData] =
    useState<ProviderWithText | null>(null);
  const [newProvider, setNewProvider] = useState<NewProvider>({
    value: "",
    label: "",
    text: "",
  });

  const utils = api.useUtils();
  const { data: providers, isLoading } = api.provider.getAll.useQuery();
  const createProvider = api.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.getAll.invalidate();
      setIsAddDialogOpen(false);
      setNewProvider({ value: "", label: "", text: "" });
    },
  });
  const updateProvider = api.provider.update.useMutation({
    onSuccess: () => {
      utils.provider.getAll.invalidate();
      setIsEditDialogOpen(false);
      setSelectedProvider(null);
      setInitialEditData(null);
    },
  });
  const deleteProvider = api.provider.delete.useMutation({
    onSuccess: () => {
      utils.provider.getAll.invalidate();
    },
  });
  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  const handleAddProvider = async () => {
    try {
      await toast.promise(
        createProvider.mutateAsync({ ...newProvider, enabled: true }),
        {
          loading: "Ajout du provider en cours...",
          success: "Provider ajouté avec succès",
          error: (err) => `Erreur lors de l'ajout du provider: ${err.message}`,
        },
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  const handleUpdateProvider = async () => {
    if (selectedProvider) {
      try {
        await toast.promise(
          updateProvider.mutateAsync({
            id: selectedProvider.id,
            value: selectedProvider.value,
            label: selectedProvider.label,
            text: selectedProvider.text,
            enabled: selectedProvider.enabled,
          }),
          {
            loading: "Mise à jour du provider en cours...",
            success: "Provider mis à jour avec succès",
            error: (err) =>
              `Erreur lors de la mise à jour du provider: ${err.message}`,
          },
        );
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
      }
    }
  };

  const handleDeleteProvider = (value: string) => {
    setSelectedProvider(providers?.find((p) => p.value === value) ?? null);
    setIsDeleteModalOpen(true);
  };

  const handleEditProvider = (provider: ProviderWithText) => {
    setSelectedProvider(provider);
    setInitialEditData(provider);
    setIsEditDialogOpen(true);
  };

  // Vérifier si des modifications ont été apportées
  const hasChanges =
    selectedProvider && initialEditData
      ? selectedProvider.value !== initialEditData.value ||
        selectedProvider.label !== initialEditData.label ||
        selectedProvider.text !== initialEditData.text ||
        selectedProvider.enabled !== initialEditData.enabled
      : false;

  const handleConfirmDelete = async () => {
    if (selectedProvider) {
      try {
        await toast.promise(
          deleteProvider.mutateAsync(selectedProvider.value),
          {
            loading: "Suppression du provider en cours...",
            success: "Provider supprimé avec succès",
            error: (err) =>
              `Erreur lors de la suppression du provider: ${err.message}`,
          },
        );
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <SecondaryLoader size="lg" />
      </div>
    );
  }
  ////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-8">
      {/* Header moderne avec gradient Clara */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-8">
        {/* Éléments décoratifs */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl" />
        <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-accent/40 to-primary/40 blur-lg" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-base-content">
              Gestion des Providers
            </h2>
            <p className="text-lg text-base-content/70">
              Gérez les fournisseurs d&apos;IA et leurs configurations
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-base-content">
                  {providers?.length || 0} provider(s) configuré(s)
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-secondary" />
                <span className="text-sm font-medium text-base-content">
                  Gestion en temps réel
                </span>
              </div>
            </div>
          </div>

          <button
            className={cn(
              "group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 px-6 py-3 text-primary ring-1 ring-primary/20 transition-all hover:from-primary/30 hover:to-primary/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
              createProvider.status === "pending" &&
                "from-base-300 to-base-200 text-base-content/50 ring-base-300/50",
            )}
            onClick={() => setIsAddDialogOpen(true)}
            aria-label="Ajouter un provider"
            aria-busy={createProvider.status === "pending"}
            disabled={createProvider.status === "pending"}
            title="Ajouter un provider"
          >
            <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
            <div className="relative z-10 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Ajouter un Provider</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal d'ajout moderne */}
      <Dialog
        as="div"
        className="relative z-[200]"
        onClose={() => setIsAddDialogOpen(false)}
        open={isAddDialogOpen}
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <DialogPanel className="relative w-full overflow-hidden rounded-2xl border border-base-300/50 bg-base-100/95 shadow-2xl backdrop-blur-xl">
                {/* Header moderne avec gradient Clara */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 p-8">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl" />
                  <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-accent/40 to-primary/40 blur-lg" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/20">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold text-base-content">
                          Ajouter un Provider
                        </DialogTitle>
                        <p className="text-base-content/70">
                          Configurez un nouveau fournisseur d&apos;IA
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsAddDialogOpen(false);
                      }}
                      className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base-content/60 transition-all duration-200 hover:scale-105 hover:bg-base-content/10 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
                      type="button"
                      style={{ pointerEvents: "auto" }}
                      aria-label="Fermer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-8">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="provider-value"
                          className="text-sm font-medium text-base-content/70"
                        >
                          Valeur *
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          id="provider-value"
                          value={newProvider.value}
                          onChange={(e) =>
                            setNewProvider({
                              ...newProvider,
                              value: e.target.value,
                            })
                          }
                          placeholder="ex: openai, anthropic, mistral"
                        />
                        <p className="text-xs text-base-content/50">
                          Identifiant unique du provider
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="provider-label"
                          className="text-sm font-medium text-base-content/70"
                        >
                          Label *
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          id="provider-label"
                          value={newProvider.label}
                          onChange={(e) =>
                            setNewProvider({
                              ...newProvider,
                              label: e.target.value,
                            })
                          }
                          placeholder="ex: OpenAI, Anthropic, Mistral"
                        />
                        <p className="text-xs text-base-content/50">
                          Nom affiché du provider
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="provider-text"
                        className="text-sm font-medium text-base-content/70"
                      >
                        Description
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        id="provider-text"
                        value={newProvider.text}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            text: e.target.value,
                          })
                        }
                        placeholder="Description du provider et de ses capacités"
                        rows={3}
                      />
                      <p className="text-xs text-base-content/50">
                        Description détaillée du provider
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-6">
                      <button
                        onClick={() => setIsAddDialogOpen(false)}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md"
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <span className="relative z-10 font-medium">
                          Annuler
                        </span>
                      </button>

                      <button
                        className={cn(
                          "group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 px-6 py-3 text-primary ring-1 ring-primary/20 transition-all hover:from-primary/30 hover:to-primary/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
                          createProvider.status === "pending" &&
                            "from-base-300 to-base-200 text-base-content/50 ring-base-300/50",
                        )}
                        onClick={handleAddProvider}
                        type="button"
                        disabled={createProvider.status === "pending"}
                        aria-busy={createProvider.status === "pending"}
                        aria-label="Ajouter le provider"
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <div className="relative z-10 flex items-center gap-2">
                          {createProvider.status === "pending" ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {createProvider.status === "pending"
                              ? "Ajout..."
                              : "Ajouter"}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal d'édition moderne */}
      <Dialog
        as="div"
        className="relative z-[200]"
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedProvider(null);
          setInitialEditData(null);
        }}
        open={isEditDialogOpen}
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <DialogPanel className="relative w-full overflow-hidden rounded-2xl border border-base-300/50 bg-base-100/95 shadow-2xl backdrop-blur-xl">
                {/* Header moderne avec gradient Clara */}
                <div className="relative overflow-hidden bg-gradient-to-r from-secondary/20 via-secondary/10 to-primary/20 p-8">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-xl" />
                  <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-accent/40 to-secondary/40 blur-lg" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/20">
                        <Pencil className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold text-base-content">
                          Modifier le Provider
                        </DialogTitle>
                        <p className="text-base-content/70">
                          Modifiez les informations du provider &quot;
                          {selectedProvider?.label}&quot;
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditDialogOpen(false);
                        setSelectedProvider(null);
                      }}
                      className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base-content/60 transition-all duration-200 hover:scale-105 hover:bg-base-content/10 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
                      type="button"
                      style={{ pointerEvents: "auto" }}
                      aria-label="Fermer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-8">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="edit-provider-value"
                          className="text-sm font-medium text-base-content/70"
                        >
                          Valeur *
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          id="edit-provider-value"
                          value={selectedProvider?.value}
                          onChange={(e) =>
                            setSelectedProvider({
                              ...selectedProvider!,
                              value: e.target.value,
                            })
                          }
                          placeholder="ex: openai, anthropic, mistral"
                        />
                        <p className="text-xs text-base-content/50">
                          Identifiant unique du provider
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="edit-provider-label"
                          className="text-sm font-medium text-base-content/70"
                        >
                          Label *
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          id="edit-provider-label"
                          value={selectedProvider?.label}
                          onChange={(e) =>
                            setSelectedProvider({
                              ...selectedProvider!,
                              label: e.target.value,
                            })
                          }
                          placeholder="ex: OpenAI, Anthropic, Mistral"
                        />
                        <p className="text-xs text-base-content/50">
                          Nom affiché du provider
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="edit-provider-text"
                        className="text-sm font-medium text-base-content/70"
                      >
                        Description
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        id="edit-provider-text"
                        value={selectedProvider?.text}
                        onChange={(e) =>
                          setSelectedProvider({
                            ...selectedProvider!,
                            text: e.target.value,
                          })
                        }
                        placeholder="Description du provider et de ses capacités"
                        rows={3}
                      />
                      <p className="text-xs text-base-content/50">
                        Description détaillée du provider
                      </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-base-300/50 bg-base-100/50 p-4">
                      <input
                        type="checkbox"
                        className="checkbox-primary checkbox"
                        checked={selectedProvider?.enabled}
                        onChange={(e) =>
                          setSelectedProvider({
                            ...selectedProvider!,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      <div>
                        <label className="text-sm font-medium text-base-content">
                          Provider activé
                        </label>
                        <p className="text-xs text-base-content/60">
                          Détermine si le provider est disponible pour les
                          utilisateurs
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-6">
                      <button
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setSelectedProvider(null);
                          setInitialEditData(null);
                        }}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md"
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <span className="relative z-10 font-medium">
                          Annuler
                        </span>
                      </button>

                      <button
                        className={cn(
                          "group relative overflow-hidden rounded-xl bg-gradient-to-r from-secondary/20 to-secondary/10 px-6 py-3 text-secondary ring-1 ring-secondary/20 transition-all hover:from-secondary/30 hover:to-secondary/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
                          (updateProvider.status === "pending" ||
                            !selectedProvider ||
                            !hasChanges) &&
                            "from-base-300 to-base-200 text-base-content/50 ring-base-300/50",
                        )}
                        onClick={handleUpdateProvider}
                        type="button"
                        aria-busy={updateProvider.status === "pending"}
                        disabled={
                          updateProvider.status === "pending" ||
                          !selectedProvider ||
                          !hasChanges
                        }
                        aria-label="Mettre à jour le provider"
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <div className="relative z-10 flex items-center gap-2">
                          {updateProvider.status === "pending" ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary"></div>
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {updateProvider.status === "pending"
                              ? "Mise à jour..."
                              : "Mettre à jour"}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Liste des providers en cartes */}
      <div className="space-y-6">
        {providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider: ProviderWithText) => (
              <div
                key={provider.value}
                className="group relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl"
              >
                {/* Élément décoratif */}
                <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-xl" />

                <div className="relative z-10 space-y-4">
                  {/* Header du provider */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-base-content">
                            {provider.label}
                          </h3>
                          <p className="text-sm text-base-content/60">
                            {provider.value}
                          </p>
                        </div>
                      </div>
                      {provider.text && (
                        <p className="mt-2 line-clamp-2 text-sm text-base-content/70">
                          {provider.text}
                        </p>
                      )}
                    </div>

                    {/* Statut */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-medium ring-1",
                          provider.enabled
                            ? "bg-success/20 text-success ring-success/20"
                            : "bg-error/20 text-error ring-error/20",
                        )}
                      >
                        {provider.enabled ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {provider.enabled ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleEditProvider(provider)}
                      className="group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-base-200/50 to-base-100 p-2 text-base-content/70 transition-all hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md"
                      title={`Modifier le provider ${provider.label}`}
                    >
                      <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover/btn:translate-x-full group-hover/btn:opacity-100" />
                      <Pencil className="relative z-10 h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProvider(provider.value)}
                      className="group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-base-200/50 to-base-100 p-2 text-base-content/70 transition-all hover:from-error/20 hover:to-error/10 hover:text-error hover:shadow-md"
                      title={`Supprimer le provider ${provider.label}`}
                    >
                      <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover/btn:translate-x-full group-hover/btn:opacity-100" />
                      <Trash2 className="relative z-10 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-base-300/50 bg-gradient-to-br from-base-100/50 to-base-200/30 py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <Server className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-base-content">
              Aucun provider
            </h3>
            <p className="text-center text-base-content/60">
              Commencez par ajouter votre premier provider d&apos;IA
            </p>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
    /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
