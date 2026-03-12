"use client";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Sparkles, Brain, FileText, Eye, Trash2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { getWebSocketUrlSimple } from "~/lib/utils/websocket";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { syncModelsData, syncModelsWithUtils } from "~/utils/modelSync";
import { useSidebar } from "~/components/SidebarProvider";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
export type Models = {
  id: number;
  name: string;
  prompt: string;
  modelName: string;
  provider: string;
  bucketName: string | null;
  isAnExpert: boolean;
  isTemplate: boolean;
  documents?: {
    id: number;
    name: string;
    size: number;
    createdAt: Date;
    mimeType: string;
    minioPath: string;
  }[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type ExtendedUser = {
  id: string;
  accountType: string;
  sessionToken: string | null;
  email: string;
  firstName: string;
  lastName: string;
  name?: string | null;
  image?: string | null;
};

type ExtendedSession = {
  user: ExtendedUser;
};
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

const SaveButton = memo(
  ({
    onClick,
    disabled,
    isLoading,
  }: {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200",
        disabled || isLoading
          ? "cursor-not-allowed bg-base-300 text-base-content/40"
          : "hover:bg-primary-focus bg-primary text-primary-content hover:scale-105 active:scale-95",
      )}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Sauvegarder
    </button>
  ),
);
SaveButton.displayName = "SaveButton";

const InputField = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-base-content/70">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full bg-base-200/50 text-base-content placeholder:text-base-content/30"
        placeholder={placeholder}
      />
    </div>
  ),
);
InputField.displayName = "InputField";

const TextareaField = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    rows?: number;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-base-content/70">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="textarea textarea-bordered w-full bg-base-200/50 text-base-content placeholder:text-base-content/30"
        placeholder={placeholder}
      />
    </div>
  ),
);
TextareaField.displayName = "TextareaField";

export default function UpdateModal({
  model,
  isOpen,
  onClose,
  isSidebarOpen: _isSidebarOpen,
}: {
  model: Models | null;
  isOpen: boolean;
  onClose: () => void;
  isSidebarOpen: boolean;
}) {
  const [hasMounted, setHasMounted] = useState(true);

  // Éviter le mismatch SSR/client - initialiser hasMounted à true pour éviter le flash
  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState<"basic" | "advanced">("basic");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState("");
  const [modelFiles, setModelFiles] = useState<
    { name: string; size: number }[]
  >([]);
  const [previousLockState, setPreviousLockState] = useState<boolean>(false);
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const { data: session } = useSession();
  const { data: modelsData } = api.availableModels.getFiltred.useQuery();

  // Hook sidebar - toujours appelé, mais avec gestion d'erreur dans les useEffect
  const { isLocked, setIsLocked, setIsOpen: setSidebarOpen } = useSidebar();

  const { data: filesData, refetch: refetchFiles } =
    api.buckets.getFilesByModelId.useQuery(
      { modelId: Number(model?.id) },
      { enabled: !!model?.id && !!model?.bucketName },
    );

  // WebSocket pour la progression
  useEffect(() => {
    const userId = (session as unknown as ExtendedSession)?.user?.id;
    if (!userId || !isUpdating) return;

    const ws = new WebSocket(getWebSocketUrlSimple());

    ws.onopen = () => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          const progressEvent = data.data;

          // Mettre à jour la progression et l'étape
          setCreationProgress(progressEvent.progress);
          setCreationStep(progressEvent.step);

          // Si la tâche est terminée
          if (progressEvent.done) {
            setIsUpdating(false);
            setCreationProgress(100);
            // Fermer la modal après un délai
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        } else if (data.type === "connected") {
        }
      } catch (error) {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [session, isUpdating, onClose]);

  const queryClient = useQueryClient();
  const utils = api.useContext();
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  const updateExpert = api.userModels.updateAnExpert.useMutation({
    onSuccess: () => {
      setCreationProgress(100);
      toast.success("Expert mis à jour avec succès !");

      // Synchroniser les données avec un petit délai
      setTimeout(() => {
        syncModelsData(queryClient);
        syncModelsWithUtils(utils);
      }, 100);

      setIsUpdating(false);
      onClose();
    },
    onError: () => {
      setCreationProgress(0);
      toast.error(
        "Une erreur est survenue lors de la mise à jour de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
      );
      setIsUpdating(false);
    },
  });

  const updateAgent = api.userModels.updateAnAgent.useMutation({
    onSuccess: () => {
      setCreationProgress(100);
      toast.success("Agent mis à jour avec succès !");
      setTimeout(() => {
        syncModelsData(queryClient);
        syncModelsWithUtils(utils);
      }, 100);

      setIsUpdating(false);
      onClose();
    },
    onError: () => {
      setCreationProgress(0);
      toast.error(
        "Une erreur est survenue lors de la mise à jour de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
      );
      setIsUpdating(false);
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles.slice(0, 1));
    },
    maxFiles: 1,
  });

  const removeFile = useCallback(() => {
    setFiles([]);
  }, []);

  const getBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1];
          if (base64) {
            resolve(base64);
          } else {
            reject(new Error("Base64 conversion failed"));
          }
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setPrompt(model.prompt);
      setModelName(model.modelName);
      setProvider(model.provider);
    }
  }, [model]);

  useEffect(() => {
    if (filesData) {
      setModelFiles(filesData);
    }
  }, [filesData]);

  // Verrouiller la sidebar quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      try {
        // Sauvegarder l'état actuel de verrouillage
        setPreviousLockState(isLocked);
        // Verrouiller la sidebar et s'assurer qu'elle est ouverte
        setIsLocked(true);
        setSidebarOpen(true);
      } catch (error) {
        console.warn("Erreur lors du verrouillage de la sidebar:", error);
      }
    }
  }, [isOpen, isLocked, setIsLocked, setSidebarOpen]);

  // Restaurer l'état de verrouillage quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      try {
        // Ne pas restaurer l'état précédent, laisser l'utilisateur décider
        // setIsLocked(previousLockState);
        // console.log("🔓 Modal fermée, garder l'état actuel de verrouillage");
      } catch (error) {
        console.warn("Erreur lors de la restauration de la sidebar:", error);
      }
    }
  }, [isOpen, previousLockState, setIsLocked]);

  const deleteFile = api.buckets.deleteFile.useMutation({
    onSuccess: () => {
      refetchFiles();
    },
    onError: () => {
      // L'erreur sera gérée par toast.promise
    },
  });

  const getFileContent = api.buckets.getFileContent.useMutation({
    onSuccess: (result) => {
      const pdfBlob = new Blob(
        [new Uint8Array(Buffer.from(result.pdf, "base64"))],
        {
          type: "application/pdf",
        },
      );
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    },
    onError: (error) => {
      console.error("Erreur lors de la récupération du fichier:", error);
      toast.error("Erreur lors de l'ouverture du fichier");
    },
  });

  const handleViewFile = useCallback(
    async (fileName: string) => {
      if (!model?.id) return;
      getFileContent.mutate({
        filename: fileName,
        modelId: Number(model.id),
      });
    },
    [model?.id, getFileContent],
  );

  const handleDeleteFile = useCallback(
    async (fileName: string) => {
      if (!model?.id) return;

      // Vérifier s'il ne reste qu'un seul document
      if (modelFiles.length <= 1) {
        toast.error(
          "Impossible de supprimer le dernier document. Un expert doit toujours avoir au moins un document d'apprentissage.",
        );
        return;
      }

      toast.promise(
        deleteFile.mutateAsync({
          name: fileName,
          modelId: Number(model.id),
        }),
        {
          loading: "Suppression du document en cours...",
          success: "Document supprimé avec succès",
          error: "Erreur lors de la suppression du document",
        },
      );
    },
    [model?.id, deleteFile, modelFiles.length],
  );

  const handleSubmit = useCallback(async () => {
    if (!model) return;

    setIsUpdating(true);
    setCreationProgress(0);

    try {
      if (model.isAnExpert) {
        await updateExpert.mutateAsync({
          modelId: model.id,
          name,
          prompt,
          modelName,
          provider,
          files:
            files.length > 0
              ? await Promise.all(
                  files.map(async (file) => ({
                    name: file.name,
                    content: await getBase64(file),
                    size: file.size,
                  })),
                )
              : undefined,
        });
      } else {
        await updateAgent.mutateAsync({
          modelId: model.id,
          name,
          prompt,
          modelName,
          provider,
        });
      }
    } catch (error) {
      setIsUpdating(false);
      setCreationProgress(0);
      throw error;
    }
  }, [
    model,
    name,
    prompt,
    modelName,
    provider,
    files,
    updateExpert,
    updateAgent,
    getBase64,
  ]);

  const closeModal = useCallback(() => {
    if (isUpdating) {
      toast.error(
        "Mise à jour en cours, veuillez patienter jusqu'à la fin du processus",
      );
      return;
    }
    setCreationProgress(0);
    setIsUpdating(false);
    const params = new URLSearchParams(searchParams);
    params.delete("modal");
    router.replace(pathname + "?" + params.toString());
    onClose();
  }, [isUpdating, searchParams, pathname, router, onClose]);

  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
  }, []);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
  }, []);

  const handleProviderChange = useCallback((newProvider: string) => {
    setProvider(newProvider);
    setModelName("");
  }, []);

  const handleModelNameChange = useCallback((newModelName: string) => {
    setModelName(newModelName);
  }, []);

  // Détection de changements pour désactiver le bouton "Mettre à jour" si aucune modification
  const hasChanges = useMemo(() => {
    if (!model) return false;
    const baseChanged =
      name !== model.name ||
      prompt !== model.prompt ||
      provider !== model.provider ||
      modelName !== model.modelName;

    // Pour les experts, considérer aussi l'ajout de fichiers comme un changement
    const filesChanged = model.isAnExpert ? files.length > 0 : false;

    return baseChanged || filesChanged;
  }, [model, name, prompt, provider, modelName, files]);

  // Optimisation des options avec useMemo
  const providerOptions = useMemo(
    () =>
      modelsData
        ? Object.keys(modelsData).map((p) => (
            <option
              key={p}
              value={p}
              disabled={!modelsData[p]?.providerEnabled}
            >
              {modelsData[p]?.providerLabel}
            </option>
          ))
        : [],
    [modelsData],
  );

  const modelOptions = useMemo(
    () =>
      modelsData?.[provider]?.models.map(
        (model: {
          llmValue: string;
          llmLabel: string;
          llmEnabled: boolean;
        }) => (
          <option
            key={model.llmValue}
            value={model.llmValue}
            disabled={!model.llmEnabled}
          >
            {model.llmLabel}
          </option>
        ),
      ) ?? [],
    [modelsData, provider],
  );

  const fileList = useMemo(
    () =>
      modelFiles.map((file) => {
        const isLastDocument = modelFiles.length <= 1;
        return (
          <div
            key={file.name}
            className="flex flex-col gap-2 rounded-lg bg-base-200 p-2 text-base-content/60 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate text-sm">{file.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewFile(file.name)}
                className="rounded-full p-1 hover:bg-base-300"
                title="Voir le fichier"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteFile(file.name)}
                disabled={isLastDocument}
                className={cn(
                  "rounded-full p-1 transition-all",
                  isLastDocument
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-error/20 hover:text-error",
                )}
                title={
                  isLastDocument
                    ? "Impossible de supprimer le dernier document"
                    : "Supprimer le fichier"
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      }),
    [modelFiles, handleViewFile, handleDeleteFile],
  );

  const modalContent = useMemo(() => {
    if (step === "advanced" && model?.bucketName) {
      return (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-base-content">
              Document d&apos;apprentissage
            </h3>
            <p className="mt-2 text-sm text-base-content/60">
              Pour que votre expert puisse répondre avec précision, il a besoin
              d&apos;apprendre à partir d&apos;un document. Ajoutez un fichier
              PDF contenant les informations spécifiques à votre domaine.
            </p>
          </div>

          <div
            {...getRootProps()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-base-content/20 bg-base-200 p-4 transition-all hover:border-primary sm:p-8"
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <Brain className="mx-auto h-8 w-8 text-base-content sm:h-12 sm:w-12" />
              <p className="mt-2 text-base-content sm:mt-4">
                Glissez-déposez votre fichier PDF ici
              </p>
              <p className="mt-1 text-sm text-base-content/70 sm:mt-2">
                ou cliquez pour sélectionner un fichier
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="rounded-lg bg-base-200 p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-base-content">
                  Document sélectionné :
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="btn btn-ghost btn-sm text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-base-content">
                <FileText className="h-4 w-4 text-base-content" />
                <span className="truncate">{files[0]?.name}</span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-base-content/60">
              Fichiers du modèle
            </label>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-2">
              {modelFiles.length === 0 ? (
                <p className="text-center text-base-content/60">
                  Aucun fichier
                </p>
              ) : (
                <div className="space-y-2">{fileList}</div>
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="space-y-2">
          <label className="text-sm font-medium text-base-content/70">
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input input-bordered w-full bg-base-200/50 text-base-content placeholder:text-base-content/30"
            placeholder={
              model?.bucketName
                ? "ex: Expert Juridique"
                : "ex: Assistant Marketing"
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-base-content/70">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={4}
            className="textarea textarea-bordered w-full bg-base-200/50 text-base-content placeholder:text-base-content/30"
            placeholder="Définissez le comportement et les instructions de base de votre assistant..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-base-content/70">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="select select-bordered w-full bg-base-200/50 text-base-content/50"
          >
            <option value="" disabled>
              Sélectionner un provider
            </option>
            {providerOptions}
          </select>
        </div>

        {provider && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/70">
              Modèle
            </label>
            <select
              value={modelName}
              onChange={(e) => handleModelNameChange(e.target.value)}
              className="select select-bordered w-full bg-base-200/50 text-base-content/50"
            >
              <option value="" disabled>
                Sélectionner un modèle
              </option>
              {modelOptions}
            </select>
          </div>
        )}
      </>
    );
  }, [
    step,
    model?.bucketName,
    files,
    modelFiles,
    name,
    prompt,
    provider,
    modelName,
    providerOptions,
    modelOptions,
    fileList,
    getRootProps,
    getInputProps,
    removeFile,
    handleNameChange,
    handlePromptChange,
    handleProviderChange,
    handleModelNameChange,
  ]);

  // Marquer l'expression comme utilisée pour éviter l'avertissement eslint sans impacter le rendu
  void modalContent;

  /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  // Rendre immédiatement - hasMounted est initialisé à true pour éviter le flash
  if (!hasMounted) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (isUpdating) {
          toast.error(
            "Mise à jour en cours, veuillez patienter jusqu'à la fin du processus",
          );
          return;
        }
        closeModal();
      }}
      className="relative z-[9999]"
    >
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity" />

          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center p-4 pt-8">
              <div className="w-full max-w-5xl">
                <DialogPanel className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl">
                  {/* Header avec gradient Clara */}
                  <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#25f5ef]/10 via-[#931975]/20 to-[#580744]/30 p-6 px-11 py-12 shadow-lg dark:from-[#25f5ef]/5 dark:via-[#931975]/10 dark:to-[#580744]/20">
                    {/* Éléments décoratifs */}
                    <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-15">
                      <div className="absolute left-[5%] top-[10%] h-16 w-16 rounded-full bg-[#25f5ef] blur-xl"></div>
                      <div className="absolute right-[15%] top-[30%] h-24 w-24 rounded-full bg-[#931975] blur-xl"></div>
                      <div className="absolute bottom-[20%] left-[25%] h-20 w-20 rounded-full bg-[#580744] blur-xl"></div>
                      <div className="absolute bottom-[10%] right-[10%] h-12 w-12 rounded-full bg-[#125eb4] blur-xl"></div>
                    </div>

                    {/* Contenu du header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                          {model?.bucketName ? (
                            <Brain className="h-6 w-6 text-primary" />
                          ) : (
                            <Sparkles className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="title-medium text-2xl text-base-content">
                            {model?.bucketName
                              ? "Modification d'Expert"
                              : "Modification d'Agent"}
                          </h3>
                          <p className="mt-1 text-base text-base-content/70">
                            {model?.bucketName
                              ? "Modifiez votre expert avec des connaissances spécialisées"
                              : "Modifiez votre agent conversationnel intelligent"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Badge d'étape - seulement pour les experts */}
                        {model?.bucketName && (
                          <div className="title-medium flex items-center gap-2 rounded-full bg-base-content/10 px-4 py-2 text-sm text-base-content shadow-lg ring-1 ring-base-content/20 dark:bg-white/20 dark:text-white dark:ring-white/20">
                            <div className="flex h-2 w-2 items-center justify-center">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full transition-all duration-300",
                                  step === "basic"
                                    ? "bg-base-content dark:bg-white"
                                    : "bg-base-content/50 dark:bg-white/50",
                                )}
                              />
                            </div>
                            <span className="text-xs">
                              {step === "basic"
                                ? "Configuration"
                                : "Connaissances"}
                            </span>
                            <div className="flex h-2 w-2 items-center justify-center">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full transition-all duration-300",
                                  step === "advanced"
                                    ? "bg-base-content dark:bg-white"
                                    : "bg-base-content/50 dark:bg-white/50",
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bouton fermer */}
                        <button
                          onClick={() => {
                            if (isUpdating) {
                              toast.error(
                                "Mise à jour en cours, veuillez patienter jusqu'à la fin du processus",
                              );
                              return;
                            }
                            closeModal();
                          }}
                          disabled={isUpdating}
                          className="relative z-10 rounded-lg p-2 text-base-content/70 transition-colors hover:bg-base-content/10 hover:text-base-content"
                          aria-label="Fermer la modale"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content - scrollable */}
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-8">
                      {/* ===== ÉTAPE 1: INFORMATIONS DE BASE ===== */}
                      {step === "basic" && (
                        <div className="space-y-6">
                          {/* Identité - Pleine largeur */}
                          <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
                                <Sparkles className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="title-medium text-lg text-base-content">
                                  Identité
                                </h3>
                                <p className="text-sm text-base-content/70">
                                  Définissez l&apos;identité de votre{" "}
                                  {model?.bucketName ? "expert" : "agent"}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4 pb-1">
                              <div className="space-y-2">
                                <label
                                  htmlFor="model-name"
                                  className="text-sm font-medium text-base-content/70"
                                >
                                  Nom de l&apos;
                                  {model?.bucketName ? "expert" : "agent"}
                                </label>
                                <input
                                  id="model-name"
                                  type="text"
                                  value={name}
                                  onChange={(e) =>
                                    handleNameChange(e.target.value)
                                  }
                                  className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  placeholder={
                                    model?.bucketName
                                      ? "ex: Expert Juridique"
                                      : "ex: Assistant Marketing"
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <label
                                  htmlFor="model-prompt"
                                  className="text-sm font-medium text-base-content/70"
                                >
                                  Instructions et comportement
                                </label>
                                <textarea
                                  id="model-prompt"
                                  value={prompt}
                                  onChange={(e) =>
                                    handlePromptChange(e.target.value)
                                  }
                                  rows={6}
                                  className="textarea textarea-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  placeholder="Définissez le comportement, la personnalité et les instructions de base de votre assistant..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Modèle IA - Pleine largeur */}
                          <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
                                <Brain className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="title-medium text-lg text-base-content">
                                  Modèle IA
                                </h3>
                                <p className="text-sm text-base-content/70">
                                  Configurez le modèle d&apos;intelligence
                                  artificielle
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label
                                  htmlFor="model-provider"
                                  className="text-sm font-medium text-base-content/70"
                                >
                                  Fournisseur
                                </label>
                                <select
                                  id="model-provider"
                                  value={provider}
                                  onChange={(e) =>
                                    handleProviderChange(e.target.value)
                                  }
                                  className="select select-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                  <option value="" disabled>
                                    Sélectionner un fournisseur
                                  </option>
                                  {providerOptions}
                                </select>
                              </div>

                              {provider && (
                                <div className="space-y-2">
                                  <label
                                    htmlFor="model-model"
                                    className="text-sm font-medium text-base-content/70"
                                  >
                                    Modèle
                                  </label>
                                  <select
                                    id="model-model"
                                    value={modelName}
                                    onChange={(e) =>
                                      handleModelNameChange(e.target.value)
                                    }
                                    className="select select-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    <option value="" disabled>
                                      Sélectionner un modèle
                                    </option>
                                    {modelOptions}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ===== ÉTAPE 2: BASE DE CONNAISSANCES ===== */}
                      {step === "advanced" && model?.bucketName && (
                        <div className="space-y-8">
                          {/* Zone de drop moderne */}
                          <div
                            {...getRootProps()}
                            className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-base-content/20 bg-gradient-to-br from-base-100 to-base-200 p-12 transition-all duration-300 hover:border-[#25f5ef] hover:shadow-lg hover:shadow-[#25f5ef]/10"
                            role="button"
                            tabIndex={0}
                            aria-label="Zone de dépôt de fichier PDF"
                          >
                            <input {...getInputProps()} />

                            {/* Éléments décoratifs */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#25f5ef]/5 to-[#931975]/5 opacity-0 transition-opacity group-hover:opacity-100" />

                            <div className="relative text-center">
                              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25f5ef]/10 to-[#931975]/20 ring-1 ring-[#25f5ef]/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#25f5ef]/20">
                                <Brain className="h-10 w-10 text-[#25f5ef] transition-all group-hover:scale-110" />
                              </div>

                              <h4 className="title-medium text-xl text-base-content">
                                Glissez-déposez votre fichier PDF
                                d&apos;apprentissage ici
                              </h4>
                              <p className="mt-2 text-base text-base-content/70">
                                ou cliquez pour sélectionner un fichier
                              </p>
                              <p className="mt-2 text-base text-base-content/70">
                                {" "}
                                L&apos;expert a besoin d&apos;un PDF pour
                                comprendre un sujet.
                              </p>
                              <p className="mt-2 text-base text-base-content/70">
                                {" "}
                                Ajoutez un document pour qu&apos;il puisse
                                apprendre.
                              </p>
                              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/60">
                                <div className="h-1 w-1 rounded-full bg-base-content/40" />
                                <span>Formats supportés : PDF</span>
                                <div className="h-1 w-1 rounded-full bg-base-content/40" />
                                <span>Taille max : 10 MB</span>
                              </div>
                            </div>
                          </div>

                          {/* Fichier sélectionné */}
                          {files.length > 0 && (
                            <div className="rounded-2xl bg-gradient-to-br from-base-100 to-base-200 p-6 shadow-lg ring-1 ring-base-content/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#25f5ef]/10 to-[#931975]/20 ring-1 ring-[#25f5ef]/20">
                                    <FileText className="h-6 w-6 text-[#25f5ef]" />
                                  </div>
                                  <div>
                                    <p className="title-medium text-base-content">
                                      Document sélectionné
                                    </p>
                                    <p className="text-sm text-base-content/70">
                                      {files[0]?.name}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile();
                                  }}
                                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error transition-all hover:scale-105 hover:bg-error/20"
                                  aria-label="Supprimer le fichier"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Fichiers existants */}
                          {modelFiles.length > 0 && (
                            <div className="rounded-2xl bg-gradient-to-br from-base-100 to-base-200 p-6 shadow-lg ring-1 ring-base-content/10">
                              <h5 className="mb-3 font-medium text-base-content">
                                Documents existants ({modelFiles.length})
                              </h5>
                              <div className="space-y-3">{fileList}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Barre de progression */}
                      {isUpdating && (
                        <div className="relative border-t border-base-content/10 bg-gradient-to-r from-base-100/70 to-base-100/90 px-6 py-6 backdrop-blur-sm">
                          <div className="absolute inset-0 overflow-hidden opacity-10">
                            <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-primary blur-xl"></div>
                            <div className="absolute bottom-0 left-1/4 h-20 w-20 rounded-full bg-[#25f5ef] blur-xl"></div>
                          </div>
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-2 ring-1 ring-primary/20">
                                <Brain className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-base font-medium text-base-content">
                                Mise à jour en cours...
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/70">
                                  Progression
                                </span>
                                <span className="font-medium text-primary">
                                  {creationProgress}%
                                </span>
                              </div>
                              {creationStep && (
                                <div className="text-sm text-base-content/60">
                                  {creationStep}
                                </div>
                              )}
                              <div className="h-3 w-full overflow-hidden rounded-full bg-base-content/10 p-0.5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#25f5ef] to-primary transition-all duration-300"
                                  style={{ width: `${creationProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation par étapes */}
                      <div className="flex items-center justify-between border-t border-base-content/10 bg-base-100/80 p-6">
                        {/* Bouton Précédent */}
                        {model?.bucketName && step === "advanced" && (
                          <button
                            onClick={() => setStep("basic")}
                            disabled={isUpdating}
                            className="title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                            <span className="relative z-10">Précédent</span>
                          </button>
                        )}

                        {/* Espace vide si on est à la première étape */}
                        {step === "basic" && <div></div>}

                        {/* Boutons d'action */}
                        <div className="flex gap-3">
                          {/* Bouton Suivant (uniquement pour les experts en configuration) */}
                          {model?.bucketName && step === "basic" && (
                            <button
                              onClick={() => setStep("advanced")}
                              disabled={
                                !name || !prompt || !provider || !modelName
                              }
                              className="title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                              <span className="relative z-10">Suivant</span>
                            </button>
                          )}

                          {/* Bouton de soumission */}
                          <button
                            onClick={handleSubmit}
                            disabled={
                              isUpdating ||
                              !name ||
                              !prompt ||
                              !provider ||
                              !modelName ||
                              !hasChanges
                            }
                            className={cn(
                              "title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                              isUpdating ||
                                !name ||
                                !prompt ||
                                !provider ||
                                !modelName ||
                                !hasChanges
                                ? "cursor-not-allowed bg-base-300 text-base-content/50"
                                : "",
                            )}
                          >
                            <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                            {isUpdating ? (
                              <div className="relative z-10 flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-base-content/30 border-t-base-content"></div>
                                Mise à jour en cours...
                              </div>
                            ) : (
                              <span className="relative z-10">
                                Mettre à jour
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
