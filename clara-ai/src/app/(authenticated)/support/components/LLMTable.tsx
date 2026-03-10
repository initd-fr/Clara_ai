"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import React, { memo, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  Description,
  DialogPanel,
} from "@headlessui/react";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import {
  Power,
  Trash2,
  AlertTriangle,
  Star,
  Brain,
  Edit,
  Settings,
} from "lucide-react";
import type { Provider, LLM } from "~/types/support";
import { cn } from "~/lib/utils";
import { useAppSession } from "~/context/SessionContext";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface LLMTableProps {
  providers: Provider[];
  llms: LLM[];
  onRefresh: () => void;
  onSelect: (llm: LLM) => void;
}

interface DeleteModalState {
  isOpen: boolean;
  llmId: number | null;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const ConfirmDeleteModal = memo(
  ({ isOpen, onClose, onConfirm }: ConfirmDeleteModalProps) => {
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <Dialog
        as="div"
        className="relative z-50"
        open={isOpen}
        onClose={onClose}
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md sm:ml-[280px]">
              <DialogPanel className="relative w-full overflow-hidden rounded-2xl bg-base-100/95 p-6 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10">
                    <AlertTriangle
                      className="h-7 w-7 text-error"
                      aria-hidden="true"
                    />
                  </div>

                  <DialogTitle
                    id="delete-modal-title"
                    className="text-xl font-semibold text-base-content"
                  >
                    Confirmer la suppression
                  </DialogTitle>

                  <Description
                    id="delete-modal-description"
                    className="mt-2 text-base text-base-content/70"
                  >
                    Êtes-vous sûr de vouloir supprimer ce LLM ?
                    <br />
                    <span className="text-sm">
                      Cette action est irréversible.
                    </span>
                  </Description>

                  <div className="mt-8 flex w-full gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn flex-1 bg-base-200 hover:bg-base-300"
                      aria-label="Annuler la suppression"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className="btn btn-error flex-1 text-white hover:bg-red-600"
                      aria-label="Confirmer la suppression"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);

ConfirmDeleteModal.displayName = "ConfirmDeleteModal";

export const LLMTable = memo(
  ({ providers, llms, onRefresh, onSelect }: LLMTableProps) => {
    const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
      isOpen: false,
      llmId: null,
    });
    const { user } = useAppSession();
    const isAdmin = user?.role === "admin";
    const canManageLLMs = user?.role === "admin" || user?.role === "support";

    const toggleLLM = api.adminModels.toggleEnable.useMutation();
    const deleteLLM = api.adminModels.delete.useMutation();

    const handleToggle = useCallback(
      async (id: number, enabled: boolean) => {
        try {
          await toast.promise(toggleLLM.mutateAsync({ id, enabled }), {
            loading: "Modification du statut...",
            success: "Statut mis à jour avec succès !",
            error:
              "Une erreur est survenue lors de la modification du statut du LLM. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
          });
          onRefresh();
        } catch (error) {
          console.error("❌ Erreur lors du toggle:", error);
        }
      },
      [toggleLLM, onRefresh],
    );

    const handleConfirmDelete = useCallback(async () => {
      if (deleteModalState.llmId !== null) {
        try {
          await toast.promise(
            deleteLLM.mutateAsync({ id: deleteModalState.llmId }),
            {
              loading: "Suppression du LLM...",
              success: "LLM supprimé avec succès !",
              error: (err) => {
                // Extraire le message d'erreur spécifique du backend depuis la structure tRPC
                let errorMessage =
                  "Une erreur est survenue lors de la suppression du LLM. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.";

                if (err?.data?.message) {
                  // Message d'erreur tRPC
                  errorMessage = err.data.message;
                } else if (err?.message) {
                  // Message d'erreur direct
                  errorMessage = err.message;
                } else if (err?.cause?.message) {
                  // Message d'erreur dans la cause
                  errorMessage = err.cause.message;
                }

                return errorMessage;
              },
            },
          );
          onRefresh();
          setDeleteModalState({ isOpen: false, llmId: null });
        } catch (error) {
          // Gestion d'erreur supplémentaire si nécessaire
          console.error("Erreur lors de la suppression du LLM:", error);
        }
      }
    }, [deleteModalState.llmId, deleteLLM, onRefresh]);

    const handleDelete = useCallback((llmId: number) => {
      setDeleteModalState({ isOpen: true, llmId });
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
      setDeleteModalState({ isOpen: false, llmId: null });
    }, []);

    // // Mémoisation des classes CSS pour les performances
    // const tableClasses = useMemo(() => "w-full", []);
    // const theadClasses = useMemo(() => "bg-base-200/50 backdrop-blur-sm", []);
    // const thClasses = useMemo(
    //   () => "px-6 py-4 text-left text-sm font-medium text-base-content/70",
    //   [],
    // );
    // const thCenterClasses = useMemo(
    //   () => "px-6 py-4 text-center text-sm font-medium text-base-content/70",
    //   [],
    // );
    // const tbodyClasses = useMemo(() => "divide-y divide-base-200", []);
    // const providerRowClasses = useMemo(
    //   () => "bg-base-200/30 backdrop-blur-sm",
    //   [],
    // );
    // const llmRowClasses = useMemo(
    //   () => "cursor-pointer bg-base-100 transition-colors hover:bg-base-200/50",
    //   [],
    // );
    // const tdClasses = useMemo(() => "px-6 py-4 text-sm text-base-content", []);
    // const tdMutedClasses = useMemo(
    //   () => "px-6 py-4 text-sm text-base-content/70",
    //   [],
    // );
    // const buttonClasses = useMemo(() => "btn btn-circle btn-ghost btn-sm", []);
    // const buttonContainerClasses = useMemo(
    //   () => "flex items-center justify-center gap-2",
    //   [],
    // );

    const renderSubscriptions = useCallback((_llm: LLM) => "—", []);

    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <>
        {/* Cartes modernes pour les LLMs */}
        <div className="space-y-8">
          {providers.map((provider) => {
            const providerLLMs = llms.filter(
              (llm) => llm.provider === provider.value,
            );

            if (providerLLMs.length === 0) return null;

            return (
              <div key={provider.value} className="space-y-4">
                {/* Header du provider */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#25f5ef]/20 to-[#931975]/20">
                    <Settings className="h-4 w-4 text-base-content" />
                  </div>
                  <h3 className="text-lg font-semibold text-base-content">
                    {provider.label}
                  </h3>
                  <span className="badge badge-primary badge-sm">
                    {providerLLMs.length} modèle
                    {providerLLMs.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Grille de cartes */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {providerLLMs.map((llm) => (
                    <div
                      key={llm.llmId}
                      className="relative overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/50 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-base-100/80 hover:shadow-xl"
                    >
                      {/* Header de la carte */}
                      <div className="relative mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base-content">
                              {llm.llmLabel}
                            </h4>
                            <p className="text-sm text-base-content/60">
                              {llm.llmValue}
                            </p>
                          </div>
                        </div>

                        {/* Badges de statut */}
                        <div className="flex gap-2">
                          {llm.llmIsDefault && (
                            <span className="badge badge-warning badge-sm">
                              <Star className="h-3 w-3" />
                              Défaut
                            </span>
                          )}
                          <span
                            className={`badge badge-sm ${llm.llmEnabled ? "badge-success" : "badge-error"}`}
                          >
                            {llm.llmEnabled ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {llm.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-base-content/70">
                          {llm.description}
                        </p>
                      )}

                      {/* Métriques */}
                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-base-200/50 p-2">
                          <span className="text-base-content/60">Input:</span>
                          <span className="ml-1 font-medium">
                            {llm.llmMaxInputTokens?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                        <div className="rounded-lg bg-base-200/50 p-2">
                          <span className="text-base-content/60">Output:</span>
                          <span className="ml-1 font-medium">
                            {llm.llmMaxOutputTokens?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Abonnements */}
                      <div className="mb-4">
                        <span className="text-xs text-base-content/60">
                          Abonnements:
                        </span>
                        <p className="text-sm text-base-content/70">
                          {renderSubscriptions(llm)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(llm);
                          }}
                          className="btn btn-primary btn-sm flex-1"
                          aria-label="Modifier le modèle"
                        >
                          <Edit className="h-3 w-3" />
                          Modifier
                        </button>
                        {canManageLLMs && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(llm.llmId, !llm.llmEnabled);
                            }}
                            className={cn(
                              "btn btn-sm",
                              llm.llmEnabled ? "btn-error" : "btn-success",
                            )}
                            disabled={toggleLLM.isPending}
                            aria-label={
                              llm.llmEnabled
                                ? "Désactiver le modèle"
                                : "Activer le modèle"
                            }
                          >
                            <Power className="h-3 w-3" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(llm.llmId);
                            }}
                            className="btn btn-error btn-sm"
                            disabled={deleteLLM.isPending}
                            aria-label="Supprimer le modèle"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <ConfirmDeleteModal
          isOpen={deleteModalState.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      </>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);
// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

LLMTable.displayName = "LLMTable";
