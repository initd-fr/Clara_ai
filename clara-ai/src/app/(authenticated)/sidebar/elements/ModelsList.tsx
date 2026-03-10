//////////////////////////////////////////////////////////////////////////////////IMPORTS/////////////////////////////////////////////////////////////////////////////////////
import { api } from "~/trpc/react";
import {
  Trash2,
  Pencil,
  Bot,
  AlertTriangle,
  Sparkles,
  Brain,
  EllipsisVertical,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { memo, useState, useEffect, useCallback } from "react";
import UpdateModal from "../components/UpdateModal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Models } from "../components/UpdateModal";
//////////////////////////////////////////////////////////////////////////////////IMPORTS/////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////
const fadeAnimation = `
@keyframes fade {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
`;

interface DeleteModalState {
  isOpen: boolean;
  modelId: number | null;
  modelName: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  modelName: string;
  onClose: () => void;
  onConfirm: () => void;
}

// Type flexible pour les modèles
type ModelData = {
  id: number;
  name: string;
  prompt: string;
  modelName: string;
  provider: string;
  bucketName: string | null;
  isAnExpert: boolean;
  isTemplate: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  documents?: Array<{
    id: number;
    name: string;
    minioPath: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }>;
  modelNameRelation?: {
    maxInputTokens?: number;
    useOnlyHumanMessage?: boolean;
  };
};
//////////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////HOOKS/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////TODO CONFIRM DELETE MODAL/////////////////////////////////////////////////////////////////////////////////////
const ConfirmDeleteModal = memo(
  ({ isOpen, modelName, onClose, onConfirm }: ConfirmDeleteModalProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
      setIsDeleting(true);
      try {
        await onConfirm();
      } finally {
        setIsDeleting(false);
      }
    };

    const handleClose = () => {
      if (!isDeleting) {
        onClose();
      }
    };

    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999]">
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="relative w-full overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl">
                {/* Header avec gradient Clara */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#ff4444]/10 via-[#cc0000]/20 to-[#990000]/30 p-8 py-12 shadow-lg dark:from-[#ff4444]/5 dark:via-[#cc0000]/10 dark:to-[#990000]/20">
                  {/* Éléments décoratifs */}
                  <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-15">
                    <div className="absolute left-[5%] top-[10%] h-16 w-16 rounded-full bg-[#ff4444] blur-xl"></div>
                    <div className="absolute right-[15%] top-[30%] h-24 w-24 rounded-full bg-[#cc0000] blur-xl"></div>
                    <div className="absolute bottom-[20%] left-[25%] h-20 w-20 rounded-full bg-[#990000] blur-xl"></div>
                    <div className="absolute bottom-[10%] right-[10%] h-12 w-12 rounded-full bg-[#ff6666] blur-xl"></div>
                  </div>

                  {/* Contenu du header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-error/20 to-error/10 ring-1 ring-error/20">
                        <Trash2 className="h-6 w-6 text-error" />
                      </div>
                      <div>
                        <h3 className="title-medium text-2xl text-base-content">
                          Supprimer le modèle
                        </h3>
                        <p className="mt-1 text-base text-base-content/70">
                          Suppression définitive du modèle et de ses données
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isDeleting}
                      className="relative z-10 rounded-lg p-2 text-base-content/70 transition-colors hover:bg-base-content/10 hover:text-base-content disabled:opacity-50"
                      aria-label="Fermer la modale"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="space-y-8">
                    {/* Avertissement */}
                    <div className="rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 ring-1 ring-warning/20">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <h3 className="title-medium text-lg text-warning">
                            Attention - Action irréversible
                          </h3>
                          <p className="mt-2 text-base text-warning/80">
                            La suppression du modèle &quot;{modelName}&quot;
                            entraînera la suppression définitive de toutes ses
                            données. Cette action ne peut pas être annulée.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Liste des données supprimées */}
                    <div className="rounded-2xl border border-error/20 bg-gradient-to-br from-error/10 to-error/5 p-6 shadow-sm">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-error/20 to-error/10 ring-1 ring-error/20">
                          <Trash2 className="h-5 w-5 text-error" />
                        </div>
                        <div>
                          <h3 className="title-medium text-lg text-error">
                            Données supprimées
                          </h3>
                          <p className="text-sm text-error/70">
                            Éléments qui seront définitivement perdus
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Configuration du modèle (prompt, température, etc.)
                          </li>
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Tous les documents d&apos;apprentissage (experts)
                          </li>
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Tous les embeddings et segments de texte
                          </li>
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Toutes les conversations avec ce modèle
                          </li>
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Historique des messages et interactions
                          </li>
                          <li className="flex items-center gap-2 text-error/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                            Fichiers stockés dans MinIO
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end border-t border-base-content/10 bg-base-100/80 p-6">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={isDeleting}
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                          <span className="relative z-10">Annuler</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={isDeleting}
                          className="title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-error/20 to-error/10 px-6 py-3 text-error ring-1 ring-error/20 transition-all hover:from-error/30 hover:to-error/20 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                          {isDeleting ? (
                            <div className="relative z-10 flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error"></div>
                              Suppression...
                            </div>
                          ) : (
                            <div className="relative z-10 flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              <span>Supprimer le modèle</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  },
);
//////////////////////////////////////////////////////////////////////////////////TODO END CONFIRM DELETE MODAL/////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TODO LOADING SKELETON/////////////////////////////////////////////////////////////////////////////////////
const LoadingSkeleton = memo(() => (
  <div className="space-y-1 px-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="group relative flex h-14 items-center justify-between border-b border-base-content/10 px-4 transition-all duration-300 ease-in-out hover:bg-base-200/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-base-300 to-base-200 shadow-sm ring-1 ring-base-content/5">
            <div className="relative h-4 w-4">
              <Sparkles className="absolute h-4 w-4 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] text-base-content/60" />
              <Brain className="absolute h-4 w-4 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_0.75s] text-base-content/60" />
              <Bot className="absolute h-4 w-4 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_1.1s] text-base-content/60" />
            </div>
          </div>
          <div className="mr-8 h-4 w-80 animate-pulse rounded bg-base-300/90" />
        </div>
        <div className="flex items-center">
          <div className="h-5 w-14 animate-pulse rounded-md bg-gradient-to-r from-base-300/80 to-base-200/80" />
          <div className="flex h-11 w-11 items-center justify-center opacity-80">
            <div className="h-6 w-6 animate-pulse rounded-full bg-base-300/90" />
          </div>
        </div>
      </div>
    ))}
  </div>
));
//////////////////////////////////////////////////////////////////////////////////TODO END LOADING SKELETON/////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TODO EMPTY STATE/////////////////////////////////////////////////////////////////////////////////////
const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center space-y-6 px-4 py-12">
    <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 ring-1 ring-primary/20">
      <Bot className="h-12 w-12 text-primary/70" />
    </div>
    <div className="text-center">
      <h3 className="font-medium text-base-content">
        Aucune conversation trouvée
      </h3>
      <p className="mt-2 text-sm text-base-content/60">
        Commencez par créer votre premier modèle ou chat
      </p>
    </div>
  </div>
));
//////////////////////////////////////////////////////////////////////////////////TODO END EMPTY STATE/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////TODO MODEL ITEM/////////////////////////////////////////////////////////////////////////////////////
const ModelItem = memo(
  ({
    model,
    onUpdate,
    onDelete,
  }: {
    model: ModelData;
    onUpdate: (model: ModelData) => void;
    onDelete: (modelId: number, modelName: string) => void;
  }) => {
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (isDropdownOpen && !target.closest(".dropdown-menu")) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isDropdownOpen]);

    const handleModelClick = (e: React.MouseEvent) => {
      // Si on clique sur les boutons d'action, on ne navigue pas
      if ((e.target as HTMLElement).closest("button")) {
        return;
      }

      // Navigation vers la page de chat avec l'ID du modèle
      router.push(`/chat/${model.id}`);
    };

    return (
      <div
        onClick={handleModelClick}
        className={cn(
          "group relative flex h-16 items-center justify-between px-4",
          "transition-all duration-300 ease-in-out",
          "hover:bg-base-200/50",
          "border-b border-base-content/10",
          "cursor-pointer",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-base-300 to-base-200 shadow-sm ring-1 ring-base-content/5">
            {model?.isTemplate ? (
              <Bot className="h-4 w-4 text-orange-500" />
            ) : model?.isAnExpert ? (
              <Brain className="h-4 w-4 text-violet-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <h3 className="truncate py-1 text-sm font-medium leading-normal text-base-content">
            {model.name}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {!model.isTemplate && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-md px-2 py-0 text-[9px] font-medium",
                !model.isAnExpert
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  : "bg-gradient-to-r from-violet-500 to-purple-500 text-white",
              )}
            >
              {model.isAnExpert ? "Expert" : "Agent"}
            </span>
          )}
          {model.isTemplate && (
            null
          )}
          {!model.isTemplate && (
            <button
              type="button"
              className="flex h-11 min-h-0 w-11 items-center justify-center opacity-60 transition-all duration-200 ease-out hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                setDropdownPosition({ top: rect.top, left: rect.right });
                setIsDropdownOpen(!isDropdownOpen);
              }}
              aria-label={`Actions pour ${model.name}`}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <EllipsisVertical className="h-6 w-6 text-base-content transition-transform duration-200 ease-out hover:scale-105" />
            </button>
          )}
          {isDropdownOpen &&
            typeof window !== "undefined" &&
            createPortal(
              <ul
                className="dropdown-menu menu fixed z-[9999] w-48 overflow-hidden rounded-xl bg-base-200/95 p-1 shadow-lg backdrop-blur-sm"
                style={{
                  top:
                    window.innerWidth < 768
                      ? dropdownPosition.top + 40
                      : dropdownPosition.top,
                  left:
                    window.innerWidth < 768
                      ? dropdownPosition.left - 192
                      : dropdownPosition.left + 8,
                }}
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-label="Actions du modèle"
              >
                <li role="none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onUpdate(model);
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-sm hover:bg-base-300"
                    role="menuitem"
                  >
                    <Pencil className="h-3.5 w-3.5 text-base-content" />
                    <span className="flex-1 text-base-content">Modifier</span>
                  </button>
                </li>
                <li role="none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(model.id, model.name);
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-error hover:bg-error/10"
                    role="menuitem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="flex-1">Supprimer</span>
                  </button>
                </li>
              </ul>,
              document.body,
            )}
        </div>
      </div>
    );
  },
);
//////////////////////////////////////////////////////////////////////////////////TODO END MODEL ITEM/////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TODO MODELS LIST/////////////////////////////////////////////////////////////////////////////////////
const ModelsList = memo(() => {
  const [modelToUpdate, setModelToUpdate] = useState<ModelData | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
    isOpen: false,
    modelId: null,
    modelName: "",
  });
  const utils = api.useContext();
  const router = useRouter();

  // Mutations pour la suppression
  const deleteAnAgentMutation = api.userModels.deleteAnAgent.useMutation({
    onSuccess: () => {
      void utils.userModels.getModels.invalidate();
      void utils.userModels.getModelById.invalidate();
      router.push("/");
    },
  });

  const deleteAnExpertMutation = api.userModels.deleteAnExpert.useMutation({
    onSuccess: () => {
      void utils.userModels.getModels.invalidate();
      void utils.userModels.getModelById.invalidate();
      router.push("/");
    },
  });

  const {
    data: models,
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = api.userModels.getModels.useQuery();
  //////////////////////////////////////////////////////////////////////////////////TODO END MODELS LIST/////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////
  // Handlers optimisés avec useCallback
  const handleDelete = useCallback(
    async (modelId: number, modelName: string) => {
      setDeleteModalState({ isOpen: true, modelId, modelName });
    },
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteModalState.modelId !== null) {
      // Trouver le modèle dans la liste pour déterminer son type
      const model = models?.find(
        (m: ModelData) => m.id === deleteModalState.modelId,
      );
      if (!model) {
        toast.error("Modèle non trouvé");
        return;
      }

      // Empêcher la suppression des modèles store
      if (model.isTemplate) {
        toast.error("Impossible de supprimer un modèle store");
        setDeleteModalState({ isOpen: false, modelId: null, modelName: "" });
        return;
      }

      // Utiliser la bonne mutation en fonction du type de modèle
      const mutation = model.isAnExpert
        ? deleteAnExpertMutation
        : deleteAnAgentMutation;

      await toast.promise(
        mutation.mutateAsync({ modelId: deleteModalState.modelId }),
        {
          loading: "Suppression du modèle...",
          success: "Modèle supprimé avec succès !",
          error:
            "Une erreur est survenue lors de la suppression de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
        },
      );
      setDeleteModalState({ isOpen: false, modelId: null, modelName: "" });
    }
  }, [
    deleteModalState.modelId,
    models,
    deleteAnExpertMutation,
    deleteAnAgentMutation,
  ]);

  const handleUpdate = useCallback((model: ModelData) => {
    setModelToUpdate(model);
  }, []);
  //////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////

  if (isErrorAll) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 px-4 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-error/10 to-error/5 p-4 ring-1 ring-error/20">
          <AlertTriangle className="h-12 w-12 text-error/70" />
        </div>
        <div className="text-center">
          <h3 className="font-medium text-base-content">
            Erreur lors du chargement
          </h3>
          <p className="mt-2 text-sm text-base-content/60">
            Impossible de charger les modèles pour le moment
          </p>
        </div>
      </div>
    );
  }

  const hasPersonalModels = models && models.length > 0;

  if (isLoadingAll) {
    return <LoadingSkeleton />;
  }

  if (!hasPersonalModels) {
    return <EmptyState />;
  }

  return (
    <>
      <style>{fadeAnimation}</style>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-1 px-4">
            {hasPersonalModels && (
              <div className="space-y-2">
                {models.map((model) => (
                  <ModelItem
                    key={`personal-${model.id}`}
                    model={model}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <UpdateModal
        model={modelToUpdate as Models}
        isOpen={!!modelToUpdate}
        onClose={() => setModelToUpdate(null)}
        isSidebarOpen={true}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        modelName={deleteModalState.modelName}
        onClose={() =>
          setDeleteModalState({ isOpen: false, modelId: null, modelName: "" })
        }
        onConfirm={handleConfirmDelete}
      />
    </>
  );
  //////////////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////
});

ModelsList.displayName = "ModelsList";
LoadingSkeleton.displayName = "LoadingSkeleton";
EmptyState.displayName = "EmptyState";
ModelItem.displayName = "ModelItem";
ConfirmDeleteModal.displayName = "ConfirmDeleteModal";

export default ModelsList;
export { LoadingSkeleton };
