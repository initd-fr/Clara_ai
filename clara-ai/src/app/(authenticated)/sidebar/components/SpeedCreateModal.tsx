"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { api } from "~/trpc/react";
import { Sparkles, Brain, FileText, X } from "lucide-react";
import CloseButton from "~/components/ui/CloseButton";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/SidebarProvider";
import toast from "react-hot-toast";
import { getWebSocketUrlSimple } from "~/lib/utils/websocket";
import ChatContent, {
  type MessageType,
} from "../../chat/[id]/elements/ChatContent";
import ChatInput from "../../chat/[id]/elements/ChatInput";
import { useDropzone } from "react-dropzone";
import { useAppSession, type UserType } from "~/context/SessionContext";

type SpeedCreateModalProps = {
  mode: "agent" | "expert";
  isOpen: boolean;
  onClose: () => void;
};

// Composants memoïsés

const MessageBubble = memo(
  ({
    message,
    isUser,
    isLoading,
  }: {
    message: string;
    isUser: boolean;
    isLoading?: boolean;
  }) => (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-content"
            : "bg-base-200 text-base-content",
        )}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
              <Brain className="h-3 w-3 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm leading-relaxed">
              {message}
              {isLoading && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-current" />
              )}
            </p>
          </div>
          {isUser && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-content/20">
              <Sparkles className="h-3 w-3 text-primary-content" />
            </div>
          )}
        </div>
      </div>
    </div>
  ),
);
MessageBubble.displayName = "MessageBubble";

export default function SpeedCreateModal({
  mode,
  isOpen,
  onClose,
}: SpeedCreateModalProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [step, setStep] = useState<"document" | "chat">("document");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { user } = useAppSession();
  const userId = user?.id;

  const { isOpen: isSidebarOpen } = useSidebar();
  const utils = api.useContext();

  // WebSocket pour la progression
  const [progressToastId, setProgressToastId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isConfiguring || !isOpen) return;

    const ws = new WebSocket(getWebSocketUrlSimple());

    ws.onopen = () => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          const progressEvent = data.data;

          // Mettre à jour le toast de progression
          if (progressToastId) {
            toast.loading(
              `Configuration en cours... ${progressEvent.progress}% - ${progressEvent.step}`,
              { id: progressToastId },
            );
          }

          // Si la tâche est terminée
          if (progressEvent.done) {
            setIsConfiguring(false);
            if (progressToastId) {
              toast.success("Modèle configuré avec succès !", {
                id: progressToastId,
                duration: 3000, // 3 secondes
              });
            }
            setProgressToastId(null);

            // Fermer la modal après un délai pour laisser le temps de voir le succès
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
  }, [userId, isConfiguring, isOpen, progressToastId, onClose]);

  // Fonction pour démarrer le toast de progression
  const startProgressToast = (mode: "agent" | "expert") => {
    const toastId = toast.loading(
      `🚀 Création de ${mode === "agent" ? "l'agent" : "l'expert"} en cours... 0%`,
      { duration: Infinity },
    );
    setProgressToastId(toastId);
    return toastId;
  };

  useEffect(() => {
    if (isOpen) {
      // Retarder les resets pour éviter double re-render
      const timeoutId = setTimeout(() => {
        setIsConfiguring(false);
        setMessages([]);
        setStep("document");
        setUploadedFile(null);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const { mutate: configureAgent } = api.speedCreate.configureAgent.useMutation(
    {
      onSuccess: (data) => {
        if (data.type === "success") {
          // L'IA a appelé la fonction de création - activer le polling maintenant
          if (data.taskCreated) {
            setIsConfiguring(true);
          }
          void utils.userModels.getModels.invalidate();
        } else if (data.type === "chat") {
          // Message de chat normal - ne pas activer le polling
          setMessages((prev) => {
            const newMessages = [...prev].filter(
              (m): m is MessageType => m !== undefined,
            );
            let lastIndex = -1;
            for (let i = newMessages.length - 1; i >= 0; i--) {
              if (newMessages[i]?.isLoading) {
                lastIndex = i;
                break;
              }
            }
            if (
              lastIndex !== -1 &&
              lastIndex < newMessages.length &&
              newMessages[lastIndex]
            ) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                isBot: true,
                text: data.content || "",
                isLoading: false,
              };
            } else {
              newMessages.push({
                isBot: true,
                text: data.content || "",
                isLoading: false,
              });
            }
            return newMessages;
          });
          setIsLoading(false);
        }
      },
      onError: () => {
        toast.error(
          "Une erreur est survenue lors de la création de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
        );
        setIsConfiguring(false);
        setIsLoading(false);
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      },
    },
  );

  const { mutate: configureExpert } =
    api.speedCreate.configureExpert.useMutation({
      onSuccess: (data) => {
        if (data.type === "success") {
          // L'IA a appelé la fonction de création - activer le polling maintenant
          setIsConfiguring(true);
          void utils.userModels.getModels.invalidate();
        } else if (data.type === "chat") {
          // Message de chat normal
          setMessages((prev) => {
            const newMessages = [...prev].filter(
              (m): m is MessageType => m !== undefined,
            );
            let lastIndex = -1;
            for (let i = newMessages.length - 1; i >= 0; i--) {
              if (newMessages[i]?.isLoading) {
                lastIndex = i;
                break;
              }
            }
            if (
              lastIndex !== -1 &&
              lastIndex < newMessages.length &&
              newMessages[lastIndex]
            ) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                isBot: true,
                text: data.content || "",
                isLoading: false,
              };
            } else {
              newMessages.push({
                isBot: true,
                text: data.content || "",
                isLoading: false,
              });
            }
            return newMessages;
          });
          setIsLoading(false);
        }
      },
      onError: () => {
        toast.error(
          "Une erreur est survenue lors de la création de votre modèle. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
        );
        setIsConfiguring(false);
        setIsLoading(false);
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      },
    });

  // Fonction pour convertir un fichier en base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Extraire la partie base64 après la virgule
          const base64 = reader.result.split(",")[1];
          if (base64) {
            resolve(base64);
          } else {
            reject(new Error("Format de fichier non valide pour base64"));
          }
        } else {
          reject(new Error("Impossible de lire le fichier"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const messageText = message.trim(); // Sauvegarder le message avant de le vider

      const userMessage = {
        isBot: false,
        text: messageText,
        isLoading: false,
      };

      const botMessage = {
        isBot: true,
        text: "",
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
      setIsLoading(true);

      // Démarrer le toast de progression APRÈS le nettoyage
      if (!progressToastId) {
        startProgressToast(mode);
      }

      // Activer le polling APRÈS le nettoyage
      setIsConfiguring(true);

      try {
        if (mode === "expert" && uploadedFile) {
          const fileContent = await getBase64(uploadedFile);
          await configureExpert({
            message: messageText,
            context: messages.map((msg) => ({
              role: msg.isBot ? "assistant" : "user",
              content: msg.text,
            })),
            document: {
              title: uploadedFile.name,
              content: fileContent,
              mimeType: uploadedFile.type,
            },
          });
        } else {
          await configureAgent({
            message: messageText,
            context: messages.map((msg) => ({
              role: msg.isBot ? "assistant" : "user",
              content: msg.text,
            })),
          });
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        setIsLoading(false);
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      }
    },
    [
      isLoading,
      progressToastId,
      mode,
      uploadedFile,
      messages,
      configureExpert,
      configureAgent,
    ],
  );

  // Fonctions memoïsées pour éviter les re-rendus
  const handleAddMessage = useCallback((message: MessageType) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleRemoveMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, prev.length - 1));
  }, []);

  const handleModeChange = useCallback(() => {
    // Pas d'action nécessaire pour le Speed Create
  }, []);

  const handleSimplify = useCallback(() => {
    // Pas d'action nécessaire pour le Speed Create
  }, []);

  const handleUploadFile = useCallback(() => {
    // Pas d'action nécessaire pour le Speed Create
  }, []);

  // Initialiser le message de l'agent quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          isBot: true,
          text: `Bonjour ! Je vais vous aider à créer un ${
            mode === "agent" ? "agent" : "expert"
          } adapté à vos besoins. Pouvez-vous me décrire ce que vous souhaitez accomplir ?`,
        },
      ]);
    }
  }, [isOpen, mode, messages.length]);

  const closeModal = () => {
    // Nettoyer le toast de progression
    if (progressToastId) {
      toast.dismiss(progressToastId);
      setProgressToastId(null);
    }

    // Réinitialiser tous les états
    setIsConfiguring(false);
    setIsLoading(false);
    setMessages([]);

    // Synchroniser toutes les données des modèles
    void utils.userModels.getModels.invalidate();
    void utils.userModels.getModelById.invalidate();

    // Fermer la modal
    onClose();
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) setUploadedFile(file);
    },
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  // Gestion de la fermeture de la modal
  const handleCloseAttempt = () => {
    console.log(
      "Tentative de fermeture - isConfiguring:",
      isConfiguring,
      "isLoading:",
      isLoading,
    );

    if (isConfiguring || isLoading) {
      toast.error("Veuillez patienter, la création est en cours...");
      return;
    }

    closeModal();
  };

  // Ne pas rendre du tout si pas ouvert
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleCloseAttempt}
      className="relative z-[10000]"
    >
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm transition-opacity" />

          <div className="fixed inset-0 z-[10000] overflow-y-auto">
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
                            <Sparkles className="h-6 w-6 text-primary" />
                          ) : (
                            <Brain className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="title-medium text-2xl text-base-content">
                            {mode === "agent"
                              ? "Création rapide d'Agent"
                              : "Création rapide d'Expert"}
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
                                  step === "document"
                                    ? "bg-base-content dark:bg-white"
                                    : "bg-base-content/50 dark:bg-white/50",
                                )}
                              />
                            </div>
                            <span className="text-xs">
                              {step === "document"
                                ? "Document"
                                : "Configuration"}
                            </span>
                            <div className="flex h-2 w-2 items-center justify-center">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full transition-all duration-300",
                                  step === "chat"
                                    ? "bg-base-content dark:bg-white"
                                    : "bg-base-content/50 dark:bg-white/50",
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bouton fermer */}
                        <CloseButton onClick={handleCloseAttempt} />
                      </div>
                    </div>
                  </div>

                  {/* Content - scrollable (désactivé pour l'étape chat afin d'éviter le double scroll) */}
                  <div
                    className={cn(
                      "flex-1 p-8",
                      step === "chat" ? "overflow-visible" : "overflow-y-auto",
                    )}
                  >
                    <div className="space-y-8">
                      {mode === "expert" && step === "document" ? (
                        <div className="space-y-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-base-content">
                              Document d&apos;apprentissage
                            </h3>
                            <p className="mt-2 text-sm text-base-content/60">
                              Ajoutez un PDF. L&apos;expert l&apos;utilisera
                              pour apprendre et répondre avec précision.
                            </p>
                          </div>

                          <div
                            {...getRootProps()}
                            className="cursor-pointer rounded-2xl border-2 border-dashed border-base-content/20 bg-gradient-to-br from-base-100 to-base-200 p-12 transition-all duration-300 hover:border-[#25f5ef] hover:shadow-lg hover:shadow-[#25f5ef]/10"
                            role="button"
                            tabIndex={0}
                            aria-label="Zone de dépôt de fichier PDF"
                          >
                            <input {...getInputProps()} />
                            <div className="text-center">
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
                              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/60">
                                <div className="h-1 w-1 rounded-full bg-base-content/40" />
                                <span>Formats supportés : PDF</span>
                                <div className="h-1 w-1 rounded-full bg-base-content/40" />
                                <span>Taille max : 10 MB</span>
                              </div>
                            </div>
                          </div>

                          {uploadedFile && (
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
                                      {uploadedFile.name}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setUploadedFile(null)}
                                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error transition-all hover:scale-105 hover:bg-error/20"
                                  aria-label="Supprimer le fichier"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  setStep("chat");
                                  setMessages((prev) => [
                                    ...prev,
                                    {
                                      isBot: true,
                                      text: `DOCUMENT: ${uploadedFile.name}`,
                                      isSystem: true,
                                    },
                                  ]);
                                }}
                                className="btn btn-primary btn-block mt-4"
                              >
                                Continuer
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="speedcreate-chatinput-scope flex h-[65vh] min-h-[420px] flex-col overflow-hidden">
                          {/* Zone de chat */}
                          <div className="flex-1 overflow-y-auto rounded-t-2xl bg-base-100/70">
                            <div className="h-full overflow-x-hidden pb-20">
                              <div className="mx-auto w-full max-w-5xl px-2 py-4 sm:px-4 sm:py-6">
                                <ChatContent messages={messages} />
                              </div>
                            </div>
                          </div>
                          {/* Input */}
                          <div className="shrink-0 bg-transparent">
                            <div className="mx-auto w-full max-w-5xl px-2 py-3 sm:px-4 sm:py-4">
                              <ChatInput
                                onSendMessage={handleSendMessage}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                                mode="chat"
                                SelectedModel={
                                  mode === "agent" ? "Agent" : "Expert"
                                }
                                modelId="speed-create"
                                onModeChange={handleModeChange}
                                typingStatus={isTyping}
                                setIsTyping={setIsTyping}
                                addMessage={handleAddMessage}
                                removeMessage={handleRemoveMessage}
                                messages={messages}
                                onSimplify={handleSimplify}
                                onUploadFile={handleUploadFile}
                                isAgent={mode === "agent"}
                                isOpen={isSidebarOpen}
                                isSpeedCreate={true}
                              />
                            </div>
                          </div>
                          {/* Override local pour empêcher le position: fixed de ChatInput uniquement dans la modal */}
                          <style jsx global>{`
                            .speedcreate-chatinput-scope
                              .fixed.bottom-4.left-0.right-0 {
                              position: static !important;
                              inset: auto !important;
                              background: transparent !important;
                            }
                            .speedcreate-chatinput-scope
                              .fixed.bottom-4.left-0.right-0
                              .mx-auto {
                              max-width: 100% !important;
                            }
                          `}</style>
                        </div>
                      )}
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
