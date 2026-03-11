"use client";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useAppSession } from "~/context/SessionContext";
import { useDraftContext } from "~/context/DraftContext";
import { toast } from "react-hot-toast";
import { api } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import SimplifyMenu from "../components/SimplifyMenu";
import type { MessageType } from "./ChatContent";
import { Send, Square, FileText, X, CirclePlus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tooltip } from "react-tooltip";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////
export type SimplifyType =
  | "shorten"
  | "lengthen"
  | "keyPoints"
  | "bulletPoints"
  | "paragraph"
  | "standard"
  | "formal"
  | "casual"
  | "professional"
  | "academic"
  | "expert"
  | "simplified"
  | "persuasive"
  | "neutral"
  | "emoji"
  | "noEmoji"
  | "children"
  | "adolescent"
  | "tweet"
  | "linkedin"
  | "story"
  | "poem"
  | "thread"
  | "toBullets"
  | "toNumberedList"
  | "toTable"
  | "toOutline"
  | "fromBullets"
  | "fromTable"
  | "mergeParagraphs"
  | "separateIdeas"
  | "scientificSummary"
  | "executiveSummary"
  | "historical"
  | "debate"
  | "counterArgument"
  | "codeCommenter"
  | "restructureLogicalFlow"
  | "translateToJargon"
  | "expandWithSources"
  | "summarizeForPresentation"
  | "questionGenerator"
  | "optimistic"
  | "critical"
  | "general";

export type UploadedFile = {
  title: string;
  content: string;
  type: AcceptedMimeType;
};

export type AcceptedMimeType =
  | "application/pdf"
  | "text/csv"
  | "text/plain"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/rtf"
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export type DocumentType = {
  content: string;
  title: string;
  mimeType: AcceptedMimeType;
};

export type DocumentData = {
  title: string;
  content: string;
  url: string;
};

type ChatInputProps = {
  onSendMessage: (
    message: string,
    options: {
      document?: DocumentType;
    },
  ) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  mode: "chat" | "voice";
  SelectedModel: string | null;
  modelId: string | null;
  onModeChange: (mode: "chat" | "voice") => void;
  onStopResponse?: () => void;
  typingStatus?: boolean;
  setIsTyping: (typing: boolean) => void;
  onSkipAnimation?: () => void;
  onMessagesClear?: () => void;
  addMessage: (message: MessageType) => void;
  removeMessage: () => void;
  messages: MessageType[];
  currentMessage?: string;
  onSimplify: (type: SimplifyType) => void;
  onUploadFile: (file: UploadedFile) => void;
  disabled?: boolean;
  isAgent?: boolean;
  isOpen: boolean;
  isSpeedCreate?: boolean;
  justCleared?: boolean;
};

// ? /////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////

const getSimplifyPrefix = (type: SimplifyType): string => {
  switch (type) {
    case "shorten":
      return "Raccourcis : ";
    case "lengthen":
      return "Développé : ";
    case "keyPoints":
      return "Points clés : ";
    case "bulletPoints":
      return "Points : ";
    case "paragraph":
      return "Paragraphes : ";
    case "standard":
      return "Standard : ";
    case "formal":
      return "Formel : ";
    case "casual":
      return "Décontracté : ";
    case "professional":
      return "Professionnel : ";
    case "academic":
      return "Académique : ";
    case "expert":
      return "Expert : ";
    case "simplified":
      return "Simplifié : ";
    case "persuasive":
      return "Persuasif : ";
    case "neutral":
      return "Neutre : ";
    case "emoji":
      return "Avec émojis : ";
    case "noEmoji":
      return "Sans émojis : ";
    case "children":
      return "Pour enfants : ";
    case "adolescent":
      return "Pour adolescents : ";
    case "tweet":
      return "Style tweet : ";
    case "linkedin":
      return "Style LinkedIn : ";
    case "story":
      return "Narratif : ";
    case "poem":
      return "Poétique : ";
    case "thread":
      return "Thread : ";
    case "toBullets":
      return "Liste à puces : ";
    case "toNumberedList":
      return "Liste numérotée : ";
    case "toTable":
      return "Tableau : ";
    case "toOutline":
      return "Plan : ";
    case "fromBullets":
      return "Texte depuis puces : ";
    case "fromTable":
      return "Texte depuis tableau : ";
    case "mergeParagraphs":
      return "Paragraphes fusionnés : ";
    case "separateIdeas":
      return "Idées séparées : ";
    case "scientificSummary":
      return "Résumé scientifique : ";
    case "executiveSummary":
      return "Résumé exécutif : ";
    case "historical":
      return "Style historique : ";
    case "debate":
      return "Débat : ";
    case "counterArgument":
      return "Contre-argument : ";
    case "codeCommenter":
      return "Commentaires de code : ";
    case "restructureLogicalFlow":
      return "Structure logique : ";
    case "translateToJargon":
      return "Jargon technique : ";
    case "expandWithSources":
      return "Avec sources : ";
    case "summarizeForPresentation":
      return "Pour présentation : ";
    case "questionGenerator":
      return "Questions : ";
    case "optimistic":
      return "Optimiste : ";
    case "critical":
      return "Critique : ";
    case "general":
      return "Grand public : ";
    default:
      return "";
  }
};

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/rtf": [".rtf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const getFileIconColor = (fileName: string) => {
  if (fileName.toLowerCase().includes(".pdf")) return "text-red-500";
  if (fileName.toLowerCase().includes(".csv")) return "text-green-500";
  if (
    fileName.toLowerCase().includes(".txt") ||
    fileName.toLowerCase().includes(".docx")
  )
    return "text-blue-500";
  if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/))
    return "text-purple-500";
  return "text-blue-500";
};

const ChatInput = memo(
  ({
    onSendMessage,
    SelectedModel,
    isLoading,
    setIsLoading,
    onStopResponse,
    typingStatus,
    setIsTyping,
    onSkipAnimation,
    modelId,
    addMessage,
    removeMessage,
    messages,
    currentMessage,
    isSpeedCreate,
    justCleared = false,
  }: ChatInputProps) => {
    //////////////////////////////////////////////////////////////////////////HOOKS/////////////////////////////////////////////////////////////////////////////////////////
    const [message, setMessage] = useState("");
    const { getDraft, setDraft, clearDraft } = useDraftContext();
    const hasHydratedDraftRef = useRef(false);

    // hydrate draft from context/session once per modelId
    useEffect(() => {
      if (!modelId || hasHydratedDraftRef.current) return;
      const draft = getDraft(modelId);
      if (typeof draft === "string" && draft.trim().length > 0) {
        setMessage(draft);
      }
      hasHydratedDraftRef.current = true;
      // intentionally not depending on getDraft to avoid re-hydration on each keystroke
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelId]);

    // persist draft on change (debounced inside context)
    useEffect(() => {
      if (modelId) {
        setDraft(modelId, message);
      }
    }, [message, modelId, setDraft]);
    const [maxChatImputChars] = useState(40000);
    const [isStopped, setIsStopped] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const { status } = useAppSession();
    const adjustTextAreaHeight = useCallback(() => {
      const textArea = textAreaRef.current;
      if (!textArea) return;

      const MAX_HEIGHT = 240; // hauteur max avant scroll interne
      textArea.style.height = "auto";
      const newHeight = Math.min(textArea.scrollHeight, MAX_HEIGHT);
      textArea.style.height = `${newHeight}px`;
      textArea.style.overflowY =
        textArea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
    }, []);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [typeInterval, setTypeInterval] = useState<NodeJS.Timeout | null>(
      null,
    );
    const queryClient = useQueryClient();

    useEffect(() => {
      adjustTextAreaHeight();
    }, [message, adjustTextAreaHeight]);

    useEffect(() => {
      if (message.length > maxChatImputChars) {
        setMessage(message.slice(0, maxChatImputChars));
        toast.error(
          `Le message a été tronqué à ${maxChatImputChars} caractères.`,
        );
      }
    }, [message, maxChatImputChars]);

    useEffect(() => {
      return () => {
        if (typeInterval) {
          clearInterval(typeInterval);
          setTypeInterval(null);
        }
      };
    }, [typeInterval]);

    /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        dropZoneRef.current &&
        !dropZoneRef.current.contains(e.relatedTarget as Node)
      ) {
        setIsDragging(false);
      }
    }, []);

    const handleSend = useCallback(() => {
      if (isLoading || typingStatus || !message.trim()) return;

      // Option A: bloquer si document invalide
      if (uploadedFile) {
        const hasValidTitle =
          typeof uploadedFile.title === "string" &&
          uploadedFile.title.trim().length > 0;
        const hasValidContent =
          typeof uploadedFile.content === "string" &&
          uploadedFile.content.trim().length > 0;
        const hasValidType =
          typeof uploadedFile.type === "string" &&
          uploadedFile.type.trim().length > 0;
        if (!hasValidTitle || !hasValidContent || !hasValidType) {
          toast.error("Fichier invalide: nom, contenu ou format manquant.");
          return;
        }
      }

      onSendMessage(message, {
        document: uploadedFile
          ? {
              content: uploadedFile.content,
              title: uploadedFile.title,
              mimeType: uploadedFile.type,
            }
          : undefined,
      });

      setMessage("");
      setUploadedFile(null);
      if (modelId) clearDraft(modelId);
    }, [
      message,
      isLoading,
      typingStatus,
      uploadedFile,
      onSendMessage,
      clearDraft,
      modelId,
    ]);

    const simplifyMessage = api.tools.simplifyMessage.useMutation({
      onMutate: () => {
        setIsStopped(false);
        setIsLoading(true);
        setIsTyping(false);
        const messageId = Date.now().toString();
        addMessage({
          id: messageId,
          isBot: true,
          text: "",
          isLoading: true,
          isTyping: false,
        });
        return { messageId };
      },

      onSuccess: (data, variables, context) => {
        if (!context?.messageId) return;

        if (isStopped) {
          setIsLoading(false);
          setIsTyping(false);
          return;
        }

        removeMessage();
        const prefix = getSimplifyPrefix(variables.optimizationType);
        const finalContent = `${prefix}\n\n${data.answer}`;

        addMessage({
          id: context.messageId,
          isBot: true,
          text: "",
          fullText: finalContent,
          isLoading: false,
          isTyping: true,
        });

        setIsLoading(false);
        setIsTyping(true);

        let currentText = "";
        const chars = finalContent.split("");
        let charIndex = 0;

        if (typeInterval) {
          clearInterval(typeInterval);
        }

        const interval = setInterval(() => {
          if (charIndex < chars.length && !isStopped) {
            currentText += chars[charIndex];
            removeMessage();
            addMessage({
              id: context.messageId,
              isBot: true,
              text: currentText,
              fullText: finalContent,
              isLoading: false,
              isTyping: true,
            });
            charIndex++;
          } else {
            clearInterval(interval);
            setTypeInterval(null);
            setIsTyping(false);
            setIsLoading(false);
          }
        }, 30);

        setTypeInterval(interval);
      },

      onError: (error) => {
        console.error("Error in simplifyMessage mutation:", error);
        toast.error("Une erreur est survenue lors de la simplification.");
        setIsTyping(false);
        setIsLoading(false);
        if (typeInterval) {
          clearInterval(typeInterval);
          setTypeInterval(null);
        }
      },
    });

    const cleanupStates = useCallback(() => {
      setIsStopped(false);
      setIsTyping(false);
      setIsLoading(false);
      if (typeInterval) {
        clearInterval(typeInterval);
        setTypeInterval(null);
      }
    }, [setIsTyping, setIsLoading, typeInterval]);

    const handleSimplify = useCallback(
      async (type: SimplifyType) => {
        if (!modelId) {
          toast.error("Veuillez sélectionner un modèle");
          return;
        }

        const messageToSimplify =
          currentMessage || messages[messages.length - 1]?.text;
        if (!messageToSimplify) {
          toast.error("Aucun message à reformuler");
          return;
        }

        try {
          setIsLoading(true);
          setIsTyping(false);
          setIsStopped(false);

          if (typeInterval) {
            clearInterval(typeInterval);
            setTypeInterval(null);
          }

          await simplifyMessage.mutateAsync({
            modelId: parseInt(modelId),
            optimizationType: type,
            content: messageToSimplify,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            console.log("Requête annulée");
          } else {
            console.error("Simplify error in handler:", error);
            toast.error("Une erreur est survenue lors de la simplification");
          }
          cleanupStates();
        }
      },
      [
        modelId,
        currentMessage,
        messages,
        setIsLoading,
        setIsTyping,
        setIsStopped,
        typeInterval,
        simplifyMessage,
        cleanupStates,
      ],
    );

    const handleDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const file = files[0];

        if (!file) return;

        if (SelectedModel?.toLowerCase().includes("mistral")) {
          if (IMAGE_MIME_TYPES.includes(file.type)) {
            toast.error(
              "Les images ne sont pas supportées pour les modèles Mistral",
            );
            return;
          }
        }

        const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
        if (!acceptedTypes.includes(file.type)) {
          toast.error(
            "Format de fichier non supporté. Formats acceptés : PDF, CSV, TXT, DOCX, JPG, PNG, GIF, WEBP",
          );
          return;
        }

        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              const base64 = base64String.split(",")[1] || base64String;
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });

          setUploadedFile({
            title: file.name,
            content: base64,
            type: file.type as AcceptedMimeType,
          });
          toast.success("Fichier chargé avec succès");
        } catch (error) {
          console.error("Erreur lors de la lecture du fichier:", error);
          toast.error("Erreur lors de la lecture du fichier");
        }
      },
      [SelectedModel],
    );

    const handleFileSelect = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (SelectedModel?.toLowerCase().includes("mistral")) {
          if (IMAGE_MIME_TYPES.includes(file.type)) {
            toast.error(
              "Les images ne sont pas supportées pour les modèles Mistral",
            );
            return;
          }
        }

        const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
        if (!acceptedTypes.includes(file.type)) {
          toast.error(
            "Format de fichier non supporté. Formats acceptés : PDF, CSV, TXT, DOCX, JPG, PNG, GIF, WEBP",
          );
          return;
        }

        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              const base64 = base64String.split(",")[1] || base64String;
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });

          setUploadedFile({
            title: file.name,
            content: base64,
            type: file.type as AcceptedMimeType,
          });
          toast.success("Fichier chargé avec succès");
        } catch (error) {
          console.error("Erreur lors de la lecture du fichier:", error);
          toast.error("Erreur lors de la lecture du fichier");
        }
      },
      [SelectedModel],
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (!typingStatus) {
            handleSend();
          }
        }
      },
      [handleSend, typingStatus],
    );

    //////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////////
    return (
      <div
        ref={dropZoneRef}
        className="fixed bottom-4 left-0 right-0 z-10 bg-gradient-to-t from-base-100 via-base-100/95 to-transparent pb-4 pt-2 sm:bottom-6 sm:pb-6"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn("transition-all duration-300", "px-2 sm:px-4")}>
          <div className="mx-auto max-w-5xl">
            {!isSpeedCreate && uploadedFile && (
              <div className="mb-4 flex items-center gap-2 rounded-full border border-primary/10 bg-base-100/80 px-3 py-2 shadow-sm backdrop-blur-xl sm:px-4">
                <FileText
                  className={cn(
                    "h-5 w-5",
                    getFileIconColor(uploadedFile.title),
                  )}
                />
                <span className="truncate text-sm font-medium text-base-content">
                  {uploadedFile.title}
                </span>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="ml-auto rounded-full p-1 text-base-content/40 hover:bg-base-200 hover:text-base-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="relative">
              {isDragging && !isSpeedCreate && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[22px] border border-primary/10 bg-primary/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-6 w-6 animate-bounce" />
                    <span className="text-center text-sm font-medium sm:text-base">
                      {SelectedModel?.toLowerCase().includes("mistral")
                        ? "Déposez votre fichier (images non supportées)"
                        : "Déposez votre fichier ici"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="relative flex items-end gap-2">
                  <div className="relative flex-1">
                    <div className="relative w-full rounded-[22px] bg-base-200/80">
                      <textarea
                        ref={textAreaRef}
                        rows={1}
                        placeholder={
                          isLoading
                            ? "Chargement du modèle..."
                            : SelectedModel
                              ? `Message à ${SelectedModel}`
                              : "Veuillez sélectionner un modèle..."
                        }
                        className={cn(
                          "w-full bg-transparent px-3 py-3 sm:px-4",
                          "text-[15px] leading-[1.35] text-base-content",
                          "transition-all duration-300",
                          "outline-none focus:outline-none focus:ring-0",
                          isLoading
                            ? "placeholder:text-base-content/60"
                            : SelectedModel
                              ? "placeholder:text-base-content/40"
                              : "placeholder:text-error",
                          "resize-none overflow-y-auto",
                        )}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || !SelectedModel}
                        style={{ maxHeight: 240 }}
                      />

                      <div className="flex items-center justify-between border-t border-base-300/10 px-3 py-2 sm:px-4">
                        <div className="flex items-center gap-2">
                          {!isSpeedCreate ? (
                            <>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept={
                                  SelectedModel?.toLowerCase().includes(
                                    "mistral",
                                  )
                                    ? ".pdf,.csv,.txt,.docx"
                                    : ".pdf,.csv,.txt,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                }
                                onChange={handleFileSelect}
                              />
                              <button
                                data-tooltip-id="file-tooltip"
                                data-tooltip-content={
                                  SelectedModel?.toLowerCase().includes(
                                    "mistral",
                                  )
                                    ? "Déposer un fichier (images non supportées)"
                                    : "Déposer un fichier"
                                }
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-base-200/50 text-base-content/60 transition-all duration-300 hover:bg-base-200/80 hover:text-base-content active:scale-95 disabled:opacity-50"
                                disabled={isLoading || !SelectedModel}
                              >
                                <CirclePlus className="h-4 w-4" />
                              </button>
                              <Tooltip id="file-tooltip" place="right" />
                            </>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium text-base-content/40">
                            {Math.round(
                              (message.length / maxChatImputChars) * 100,
                            )}
                            %
                          </div>

                          {status === "authenticated" &&
                            !uploadedFile &&
                            !isSpeedCreate && (
                              <SimplifyMenu
                                onSimplify={handleSimplify}
                                disabled={
                                  isLoading ||
                                  !SelectedModel ||
                                  !modelId ||
                                  messages.length === 0 ||
                                  justCleared
                                }
                                className="h-7 w-7 rounded-full bg-base-200/50 text-base-content/60 transition-all duration-300 hover:bg-base-200 hover:text-base-content active:scale-95"
                              />
                            )}

                          {message.length > 0 &&
                            !isLoading &&
                            !typingStatus && (
                              <button
                                onClick={handleSend}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content transition-all duration-300 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}

                          {!isSpeedCreate && isLoading && !typingStatus && (
                            <button
                              onClick={() => {
                                setIsStopped(true);
                                queryClient.cancelQueries();
                                if (typeInterval) {
                                  clearInterval(typeInterval);
                                  setTypeInterval(null);
                                }
                                setIsTyping(false);
                                setIsLoading(false);
                                if (onStopResponse) {
                                  onStopResponse();
                                }
                                toast.error("Génération arrêtée");
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-error transition-all duration-300 hover:bg-error/90 active:scale-95"
                              aria-label="Arrêter la réponse"
                            >
                              <Square className="h-4 w-4 text-primary-content" />
                            </button>
                          )}

                          {!isSpeedCreate &&
                            typingStatus &&
                            onSkipAnimation && (
                              <button
                                onClick={() => {
                                  if (typeInterval) {
                                    clearInterval(typeInterval);
                                    setTypeInterval(null);
                                  }
                                  onSkipAnimation();
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 hover:bg-primary/20 active:scale-95"
                                aria-label="Accélérer l'animation"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polygon points="5 4 15 12 5 20 5 4" />
                                  <line x1="19" y1="5" x2="19" y2="19" />
                                </svg>
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
//////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////////
ChatInput.displayName = "ChatInput";

export default ChatInput;
