"use client";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { FileText, Brain, Settings, Cpu, User, Bot, X } from "lucide-react";
import CloseButton from "~/components/ui/CloseButton";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import { getWebSocketUrlSimple } from "~/lib/utils/websocket";
import { useAppSession } from "~/context/SessionContext";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogPanel } from "@headlessui/react";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type AvailableModel = {
  llmValue: string;
  llmLabel: string;
  llmEnabled: boolean;
  llmClassName?: string;
};

export type SetModelModalProps = {
  type: "solo" | "team";
  mode: "agent" | "expert";
  isOpen: boolean;
  onClose: () => void;
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

const ProgressBar = memo(
  ({ progress, step }: { progress: number; step?: string }) => (
    <div className="mb-4 w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-base-content">
          Progression
        </span>
        <span className="text-sm font-medium text-primary">{progress}%</span>
      </div>
      {step && <div className="mb-2 text-sm text-base-content/70">{step}</div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-base-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  ),
);

const BasicStepContent = memo(
  ({
    name,
    prompt,
    provider,
    modelName,
    providerOptions,
    modelOptions,
    mode,
    onNameChange,
    onPromptChange,
    onProviderChange,
    onModelNameChange,
  }: {
    name: string;
    prompt: string;
    provider: string;
    modelName: string;
    providerOptions: React.ReactNode;
    modelOptions: React.ReactNode;
    mode: "agent" | "expert";
    onNameChange: (value: string) => void;
    onPromptChange: (value: string) => void;
    onProviderChange: (value: string) => void;
    onModelNameChange: (value: string) => void;
  }) => (
    <div className="space-y-6">
      {/* Identité - Pleine largeur */}
      <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="title-medium text-lg text-base-content">Identité</h3>
            <p className="text-sm text-base-content/70">
              Définissez l&apos;identité de votre{" "}
              {mode === "agent" ? "agent" : "expert"}
            </p>
          </div>
        </div>

        <div className="space-y-4 pb-1">
          <div className="space-y-2">
            <label
              htmlFor="model-name"
              className="text-sm font-medium text-base-content/70"
            >
              Nom de l&apos;{mode === "agent" ? "agent" : "expert"}
            </label>
            <input
              id="model-name"
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={`ex: ${mode === "agent" ? "Assistant Marketing" : "Expert Comptable"}`}
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
              onChange={(e) => onPromptChange(e.target.value)}
              rows={6}
              className="textarea textarea-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={`Définissez le comportement, la personnalité et les instructions de base de votre ${mode === "agent" ? "agent" : "expert"}...`}
            />
          </div>
        </div>
      </div>

      {/* Modèle IA */}
      <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="title-medium text-lg text-base-content">
              Modèle IA
            </h3>
            <p className="text-sm text-base-content/70">
              Configurez le modèle d&apos;intelligence artificielle
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
              onChange={(e) => onProviderChange(e.target.value)}
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
                onChange={(e) => onModelNameChange(e.target.value)}
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
  ),
);

const AdvancedStepContent = memo(
  ({
    files,
    getRootProps,
    getInputProps,
    removeFile,
  }: {
    files: File[];
    getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
    getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
    removeFile: () => void;
  }) => (
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
            Glissez-déposez votre fichier PDF d&apos;apprentissage ici
          </h4>
          <p className="mt-2 text-base text-base-content/70">
            ou cliquez pour sélectionner un fichier
          </p>
          <p className="mt-2 text-base text-base-content/70">
            {" "}
            L&apos;expert a besoin d&apos;un PDF pour comprendre un sujet.
          </p>
          <p className="mt-2 text-base text-base-content/70">
            {" "}
            Ajoutez un document pour qu&apos;il puisse apprendre.
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
                <p className="text-sm text-base-content/70">{files[0]?.name}</p>
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
    </div>
  ),
);

CloseButton.displayName = "CloseButton";
ProgressBar.displayName = "ProgressBar";
BasicStepContent.displayName = "BasicStepContent";
AdvancedStepContent.displayName = "AdvancedStepContent";

export default function SetModelModal({
  mode,
  isOpen,
  onClose,
}: SetModelModalProps) {
  const [step, setStep] = useState<"basic" | "advanced">("basic");

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState("");
  const [taskId] = useState<string | null>(null);
  const { user } = useAppSession();

  const { data: modelsData } = api.availableModels.getFiltred.useQuery();
  const utils = api.useContext();

  const createAgent = api.userModels.createAnAgent.useMutation({
    onSuccess: () => {
      setCreationProgress(100);
      toast.success("Agent créé avec succès !");

      void utils.userModels.getModels.invalidate();
      void utils.userModels.getModelById.invalidate();

      setIsCreating(false);
      onClose();
    },
    onError: () => {
      setCreationProgress(0);
      toast.error(
        "Une erreur est survenue lors de la création de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
      );
      setIsCreating(false);
    },
  });

  const createExpert = api.userModels.createAnExpert.useMutation({
    onSuccess: () => {
      setCreationProgress(100);
      toast.success("Expert créé avec succès !");
      void utils.userModels.getModels.invalidate();
      void utils.userModels.getModelById.invalidate();

      setIsCreating(false);
      onClose();
    },
    onError: () => {
      setCreationProgress(0);
      toast.error(
        "Une erreur est survenue lors de la création de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
      );
      setIsCreating(false);
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) setFiles(acceptedFiles.slice(0, 1));
    },
    disabled: mode !== "expert",
    maxFiles: 1,
  });

  // WebSocket pour la progression
  useEffect(() => {
    if (!user?.id || !isCreating) return;

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
            setIsCreating(false);
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
  }, [user?.id, isCreating, isOpen, onClose]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCreating) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isCreating]);

  useEffect(() => {
    if (taskId && user?.id) {
      setIsCreating(true);
    }
  }, [taskId, user?.id]);

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

  const closeModal = useCallback(() => {
    if (isCreating) {
      toast.error(
        "Création en cours, veuillez patienter jusqu'à la fin du processus",
      );
      return;
    }
    onClose();
  }, [isCreating, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name || !prompt || !provider || !modelName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (mode === "expert" && files.length === 0) {
      toast.error("Veuillez ajouter un document pour l\u00e9xpert");
      return;
    }

    setIsCreating(true);
    setCreationProgress(0);

    try {
      if (mode === "agent") {
        createAgent.mutate({
          name,
          prompt,
          provider,
          modelName,
          isAnExpert: false,
        });
      } else {
        if (!files[0]) {
          toast.error("Aucun fichier sélectionné");
          setIsCreating(false);
          return;
        }

        const fileBase64 = await getBase64(files[0]);
        const filesData = [
          {
            name: files[0].name,
            content: fileBase64,
            size: files[0].size,
          },
        ];

        createExpert.mutate({
          name,
          prompt,
          provider,
          modelName,
          isAnExpert: true,
          files: filesData,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast.error(
        "Une erreur est survenue lors de la création de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
      );
      setIsCreating(false);
    }
  }, [
    name,
    prompt,
    provider,
    modelName,
    mode,
    files,
    createAgent,
    createExpert,
    getBase64,
  ]);

  const handleProviderChange = useCallback((newProvider: string) => {
    setProvider(newProvider);
    setModelName("");
  }, []);

  const handleModelNameChange = useCallback((newModelName: string) => {
    setModelName(newModelName);
  }, []);

  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
  }, []);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
  }, []);

  const providerOptions = useMemo(
    () =>
      modelsData
        ? Object.keys(modelsData).map((p) => (
            <option
              key={p}
              value={p}
              disabled={
                !modelsData[p]?.providerEnabled // Exclure les providers désactivés
              }
            >
              {modelsData[p]?.providerLabel}
            </option>
          ))
        : [],
    [modelsData],
  );

  // Optimisation du rendu des options de modèle
  const modelOptions = useMemo(
    () =>
      modelsData?.[provider]?.models.map((model: AvailableModel) => (
        <option
          className="text-base-content/50"
          key={model.llmValue}
          value={model.llmValue}
          disabled={!model.llmEnabled}
        >
          {model.llmLabel}
        </option>
      )) ?? [],
    [modelsData, provider],
  );

  const modalContent = useMemo(() => {
    if (step === "advanced" && mode === "expert") {
      return (
        <AdvancedStepContent
          files={files}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          removeFile={removeFile}
        />
      );
    }

    return (
      <BasicStepContent
        name={name}
        prompt={prompt}
        provider={provider}
        modelName={modelName}
        providerOptions={providerOptions}
        modelOptions={modelOptions}
        mode={mode}
        onNameChange={handleNameChange}
        onPromptChange={handlePromptChange}
        onProviderChange={handleProviderChange}
        onModelNameChange={handleModelNameChange}
      />
    );
  }, [
    step,
    mode,
    files,
    name,
    prompt,
    provider,
    modelName,
    providerOptions,
    modelOptions,
    getRootProps,
    getInputProps,
    removeFile,
    handleNameChange,
    handlePromptChange,
    handleProviderChange,
    handleModelNameChange,
  ]);

  const submitButton = useMemo(
    () => (
      <div className="flex items-center justify-between">
        {/* Bouton Précédent pour les experts */}
        {mode === "expert" && step === "advanced" && (
          <button
            onClick={() => setStep("basic")}
            disabled={isCreating}
            className="title-medium flex items-center gap-2 rounded-xl px-6 py-3 text-base-content/70 transition-all hover:bg-base-200 hover:text-base-content disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Settings className="h-4 w-4" />
            Précédent
          </button>
        )}

        {/* Boutons d'action */}
        <div
          className={cn(
            "flex gap-3",
            mode === "expert" && step === "advanced" ? "ml-auto" : "ml-auto",
          )}
        >
          {/* Bouton Suivant pour les experts en configuration */}
          {mode === "expert" && step === "basic" && (
            <button
              onClick={() => setStep("advanced")}
              disabled={!name || !prompt || !provider || !modelName}
              className={cn(
                "title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                !name || !prompt || !provider || !modelName
                  ? "cursor-not-allowed bg-base-300 text-base-content/50"
                  : "",
              )}
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              <span className="relative z-10">Suivant</span>
            </button>
          )}

          {/* Bouton de soumission - seulement pour les agents ou experts à la dernière étape */}
          {(mode === "agent" || (mode === "expert" && step === "advanced")) && (
            <button
              onClick={handleSubmit}
              disabled={
                isCreating ||
                !name ||
                !prompt ||
                !provider ||
                !modelName ||
                (mode === "expert" && files.length === 0)
              }
              className={cn(
                "title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                isCreating ||
                  !name ||
                  !prompt ||
                  !provider ||
                  !modelName ||
                  (mode === "expert" && files.length === 0)
                  ? "cursor-not-allowed bg-base-300 text-base-content/50"
                  : "",
              )}
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Création en cours
                </div>
              ) : (
                <span className="relative z-10">
                  {mode === "agent" ? "Créer l'agent" : "Créer l'expert"}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    ),
    [
      isCreating,
      name,
      prompt,
      provider,
      modelName,
      mode,
      files.length,
      handleSubmit,
      step,
    ],
  );
  ////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  // Ne pas rendre du tout si pas ouvert
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-[9999]">
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity" />

          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center p-4 pt-8">
              <div className="w-full max-w-5xl">
                <DialogPanel className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl">
                  {/* Header avec gradient Clara */}
                  <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#25f5ef]/10 via-[#931975]/20 to-[#580744]/30 p-6 py-8 shadow-lg dark:from-[#25f5ef]/5 dark:via-[#931975]/10 dark:to-[#580744]/20">
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
                          {mode === "agent" ? (
                            <Bot className="h-6 w-6 text-primary" />
                          ) : (
                            <Brain className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="title-medium text-2xl text-base-content">
                            {mode === "agent"
                              ? "Création d'Agent"
                              : "Création d'Expert"}
                          </h3>
                          <p className="mt-1 text-base text-base-content/70">
                            {mode === "agent"
                              ? "Configurez votre agent conversationnel intelligent"
                              : "Configurez votre expert avec des connaissances spécialisées"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Badge d'étape - seulement pour les experts */}
                        {mode === "expert" && (
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
                        <CloseButton onClick={closeModal} />
                      </div>
                    </div>
                  </div>

                  {/* Content - scrollable */}
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-8">
                      {modalContent}

                      {/* Bouton de soumission */}
                      {isCreating && (
                        <ProgressBar
                          progress={creationProgress}
                          step={creationStep}
                        />
                      )}
                      {submitButton}
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
  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
}
