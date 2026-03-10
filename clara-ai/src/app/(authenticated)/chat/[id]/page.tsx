"use client";

/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import ChatInput from "./elements/ChatInput";
import ChatContent, { type MessageType } from "./elements/ChatContent";
import { MessageCircleOff, Sparkles, Brain, Bot } from "lucide-react";

import { useSidebar } from "~/components/SidebarProvider";
import toast from "react-hot-toast";
import { useMessageContext } from "~/context/MessageContext";
import type { DocumentType } from "./elements/ChatInput";
import { useQueryClient } from "@tanstack/react-query";
import { handleTRPCForceLogout } from "~/app/utils/error";
import SecondaryLoader from "~/components/SecondaryLoader";
import { cn } from "~/lib/utils";

/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type ChatResponse = {
  answer: string;
  sources?: Array<unknown>;
  documents?: Array<{
    title: string;
    content: string;
    mimeType?: string;
  }>;
};

// Type pour le modèle (personnel ou store)
type ChatModel = Record<string, unknown> | null | undefined;

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
// Composant Header optimisé
const ChatHeader = memo(
  ({
    model,
    isOpen,
    onClearMessages,
    canClear,
  }: {
    model: ChatModel;
    isOpen: boolean;
    onClearMessages: () => void;
    canClear: boolean;
  }) => {
    const modelIcon = useMemo(() => {
      if ((model as ChatModel)?.isTemplate)
        return <Bot className="h-5 w-5 text-orange-500" />;
      if ((model as ChatModel)?.isAnExpert)
        return <Brain className="h-5 w-5 text-base-content" />;
      return <Sparkles className="h-5 w-5 text-base-content" />;
    }, [model]);

    const modelBadge = useMemo(() => {
      // Pas de badge pour les modèles store
      if ((model as ChatModel)?.isTemplate) return null;
      if ((model as ChatModel)?.isAnExpert)
        return {
          text: "Expert",
          className:
            "border-0 bg-gradient-to-r from-violet-500 to-purple-500 text-white",
        };
      return {
        text: "Agent",
        className:
          "border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
      };
    }, [model]);

    return (
      <div className="shrink-0 rounded-tl-3xl border-b border-base-content/5 shadow-sm backdrop-blur-xl">
        <div className="pb-2 pt-2">
          <div
            className={cn(
              "flex items-center justify-between overflow-hidden px-4",
              !isOpen && "ml-16",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden sm:gap-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-200">
                {modelIcon}
              </div>
              <div className="h-8 w-px shrink-0 bg-gradient-to-b from-base-content/20 to-base-content/30" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <h1 className="logo-gradient-wa truncate text-lg font-medium tracking-tight sm:text-xl">
                    {(model as ChatModel)?.isTemplate
                      ? ((model as ChatModel)?.chatName as string) || "Chat"
                      : ((model as ChatModel)?.name as string) || "Chat"}
                  </h1>
                  {modelBadge && (
                    <div
                      className={cn(
                        "badge badge-xs shrink-0 p-2 text-xs",
                        modelBadge.className,
                      )}
                    >
                      {modelBadge.text}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  <p className="truncate text-xs text-base-content/60 backdrop-blur-xl">
                    {(model as ChatModel)?.isTemplate
                      ? ((
                          (
                            (model as ChatModel)?.storeModel as Record<
                              string,
                              unknown
                            >
                          )?.model as Record<string, unknown>
                        )?.name as string) || "Clara AI"
                      : ((
                          (model as ChatModel)?.modelNameRelation as Record<
                            string,
                            unknown
                          >
                        )?.label as string) || "Clara AI"}
                  </p>
                </div>
              </div>
            </div>
            {/* Icône d'effacement - toujours visible car fonctionne pour les deux types */}
            <div
              className="tooltip tooltip-left flex shrink-0 items-center gap-2"
              data-tip="Effacer la conversation"
            >
              <button
                onClick={onClearMessages}
                className={
                  "group relative rounded-full p-2 text-base-content/70 transition-all " +
                  (!canClear
                    ? "bg-base-200 opacity-50"
                    : "cursor-pointer hover:bg-base-200 hover:text-base-content hover:shadow-lg")
                }
                disabled={!canClear}
                style={{ cursor: !canClear ? "not-allowed" : "pointer" }}
              >
                <MessageCircleOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";
/////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
// Composant principal optimisé
const ChatPage = memo(() => {
  const { id } = useParams();
  const router = useRouter();

  const { isOpen } = useSidebar();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [stopTyping, setStopTyping] = useState(false);
  const typeIntervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshDailyMessages = useMessageContext();
  const queryClient = useQueryClient();
  const isStoppedRef = useRef(false);
  const [version, setVersion] = useState(0);
  const [justCleared, setJustCleared] = useState(false);
  const [isRefetchingAfterClean, setIsRefetchingAfterClean] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isReloading, setIsReloading] = useState(false); // Protection contre le double rechargement

  // Vérifier que nous sommes côté client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Empêcher le scroll de page uniquement sur cette page
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = (document.body.style as any)
      .overscrollBehavior;
    const originalHtmlOverscroll = (document.documentElement.style as any)
      .overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    (document.body.style as any).overscrollBehavior = "none";
    (document.documentElement.style as any).overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      (document.body.style as any).overscrollBehavior = originalBodyOverscroll;
      (document.documentElement.style as any).overscrollBehavior =
        originalHtmlOverscroll;
    };
  }, []);

  const showFriendlyError = (error: unknown) => {
    try {
      const anyErr = error as any;
      const zodIssues = anyErr?.data?.zodError?.issues as
        | Array<{ path: string[]; message: string }>
        | undefined;
      if (Array.isArray(zodIssues) && zodIssues.length > 0) {
        const first = zodIssues[0];
        if (first) {
          const pathLabel =
            Array.isArray(first.path) && first.path.length
              ? ` (${first.path.join(".")})`
              : "";
          const message =
            typeof first.message === "string" && first.message.length
              ? first.message
              : "Entrée invalide";
          toast.error(`Entrée invalide${pathLabel}: ${message}`);
        } else {
          toast.error("Entrée invalide");
        }
      } else if (anyErr?.message) {
        toast.error(anyErr.message);
      } else {
        toast.error("Une erreur est survenue. Réessayez.");
      }
      // Log complet pour les devs
      console.error("Chat error:", error);
    } catch (e) {
      toast.error("Une erreur est survenue. Réessayez.");
      console.error("Chat error (fallback):", error);
    }
  };

  // Optimisation des mutations
  const openaiMutation = api.openai.ask.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) showFriendlyError(error);
    },
  });
  const anthropicMutation = api.anthropic.ask.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) showFriendlyError(error);
    },
  });
  const mistralMutation = api.mistral.ask.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) showFriendlyError(error);
    },
  });
  const googleMutation = api.google.ask.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) showFriendlyError(error);
    },
  });
  const saveMessageMutation = api.message.saveMessage.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) {
        toast.error(error.message);
      }
    },
    onSuccess: () => {
      // Invalider manuellement le cache des messages après un délai
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
        });
      }, 2000); // Délai de 2 secondes
    },
  });
  const clearMessagesMutation = api.message.clearModelMessages.useMutation({
    onError: (error) => {
      if (!handleTRPCForceLogout(error)) {
        toast.error(error.message);
      }
    },
    onSuccess: () => {
      // Invalider le cache des messages après suppression
      void queryClient.invalidateQueries({
        queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
      });
      // Forcer le rechargement des messages
      setMessages([]);
      setVersion((prev) => prev + 1);
    },
  });

  // Modèle personnel uniquement (version locale sans store)
  const {
    data: personalModel,
    error: personalModelError,
    isLoading: isPersonalModelLoading,
  } = api.userModels.getModelById.useQuery(
    { id: Number(id) },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 0,
      refetchInterval: false,
      enabled: !!id,
    },
  );

  const model = personalModel;
  const isModelLoading = isPersonalModelLoading;
  const error = personalModelError;

  const { data: allMessages, error: allMessagesError } =
    api.message.getModelMessages.useQuery(
      { modelId: Number(id) },
      {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        staleTime: 0,
        enabled: !!id,
      },
    );

  const messagesToUse = allMessages;

  useEffect(() => {
    setIsReloading(true);
    void queryClient.invalidateQueries({
      queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setIsReloading(true);
      void queryClient.invalidateQueries({
        queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
      });

      // Aussi recharger les données du modèle
      const queryData = queryClient.getQueryData([
        "userModels",
        "getModelById",
        { id: Number(id) },
      ]);

      if (queryData) {
        const lastUpdate = (queryData as Record<string, unknown>)?.updatedAt;
        const now = new Date();
        const timeDiff =
          now.getTime() - new Date(lastUpdate as string).getTime();

        if (timeDiff > 30 * 1000) {
          void queryClient.invalidateQueries({
            queryKey: ["userModels", "getModelById", { id: Number(id) }],
          });
        }
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [queryClient, id, isReloading]);

  // Optimisation du chargement des messages
  const loadMessages = useCallback(() => {
    // PROTECTION FORTE : ne jamais recharger si on vient de faire un clear
    if (justCleared || isClearing) {
      return;
    }

    // Ne pas vider les messages si on est en train de taper (réponse en cours)
    if (isTyping) return;

    // 🔥 PROTECTION : Éviter le double rechargement
    if (isReloading) {
      return;
    }

    // 🔥 CORRECTION : Ne pas recharger si on a des messages locaux ET qu'on n'est pas en train de revenir sur la page
    // Cela évite de recharger les messages supprimés quand on envoie un nouveau message
    if (messages.length > 0 && !isReloading) {
      return;
    }

    // 🔥 CORRECTION FINALE : Recharger seulement si nécessaire
    // Éviter les rechargements inutiles qui causent la duplication

    if (messagesToUse && Array.isArray(messagesToUse)) {
      if (messagesToUse.length > 0) {
        // 🔥 CORRECTION : Charger uniquement depuis la DB pour éviter les duplications

        // Convertir les messages de la DB en format local avec clés stables pour dédup
        const dbMessages = messagesToUse.map((msg) => ({
          id: String(
            (msg as any).id ??
              `${msg.isBot ? "bot" : "user"}-${(msg as any).createdAt ?? Math.random()}`,
          ),
          isBot: msg.isBot,
          text: msg.content,
          document:
            "document" in msg && msg.document
              ? {
                  title: msg.document.title,
                  content: msg.document.content,
                  url: (msg as any).document?.url || undefined,
                }
              : undefined,
          isTyping: false,
          isLoading: false,
          fullText: msg.content,
          timestamp: (msg as any).createdAt
            ? new Date((msg as any).createdAt).getTime()
            : undefined,
        }));

        // Déduplication par id + ordre chronologique
        const seen = new Set<string>();
        const deduped = dbMessages.filter((m) => {
          const key =
            m.id ??
            `${m.isBot ? "bot" : "user"}-${m.timestamp ?? 0}-${m.text.slice(0, 20)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setMessages(
          deduped.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)),
        );

        // Le rechargement demandé est traité
        setIsReloading(false);
      } else {
        // Si la DB est vide, ne pas vider les messages locaux automatiquement
        // Ils seront vidés seulement lors d'un clear explicite

        // Fin de cycle de reload éventuel
        if (isReloading) setIsReloading(false);
      }
    }
    // Supprimé la logique qui vidait les messages quand messagesToUse était null/vide
    // car cela causait la disparition des bulles pendant les réponses
  }, [
    messagesToUse,
    isTyping,
    justCleared,
    isClearing,
    isReloading,
    messages.length,
  ]);

  useEffect(() => {
    // Ne pas charger automatiquement si on vient de faire un clear
    if (justCleared) {
      console.log(
        "🚫 useEffect loadMessages blocked - justCleared:",
        justCleared,
      );
      return;
    }

    // 🔥 CORRECTION : Ajouter un délai pour éviter les rechargements trop fréquents
    const timeoutId = setTimeout(() => {
      loadMessages();
    }, 100); // Délai de 100ms pour éviter les rechargements en cascade

    return () => clearTimeout(timeoutId);
  }, [loadMessages, justCleared]);

  // Hydratation immédiate depuis la DB dès que les données arrivent
  useEffect(() => {
    if (Array.isArray(messagesToUse)) {
      const dbMessages = messagesToUse.map((msg) => ({
        id: String(
          (msg as any).id ??
            `${msg.isBot ? "bot" : "user"}-${(msg as any).createdAt ?? Math.random()}`,
        ),
        isBot: msg.isBot,
        text: msg.content,
        document:
          "document" in msg && msg.document
            ? {
                title: msg.document.title,
                content: msg.document.content,
                url: (msg as any).document?.url || undefined,
              }
            : undefined,
        isTyping: false,
        isLoading: false,
        fullText: msg.content,
        timestamp: (msg as any).createdAt
          ? new Date((msg as any).createdAt).getTime()
          : undefined,
      }));

      const seen = new Set<string>();
      const deduped = dbMessages.filter((m) => {
        const key =
          m.id ??
          `${m.isBot ? "bot" : "user"}-${m.timestamp ?? 0}-${m.text.slice(0, 20)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setMessages(
        deduped.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)),
      );
      setIsReloading(false);
    }
  }, [messagesToUse]);

  useEffect(() => {
    if (!isPersonalModelLoading && (error || !personalModel)) {
      toast.error("Ce modèle n'existe pas ou a été supprimé");
      router.push("/");
    }
  }, [error, personalModel, isPersonalModelLoading, router]);

  useEffect(() => {
    if (allMessagesError) {
      handleTRPCForceLogout(allMessagesError);
    }
  }, [allMessagesError]);

  useEffect(() => {
    if (error) {
      handleTRPCForceLogout(error);
    }
  }, [error]);

  // Handlers optimisés
  const handleStopResponse = useCallback(async () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = undefined;
    }

    void openaiMutation.reset();
    void anthropicMutation.reset();
    void mistralMutation.reset();
    void googleMutation.reset();

    setIsTyping(false);
    setIsLoading(false);
    setStopTyping(true);
    isStoppedRef.current = true;

    setMessages((prev) => {
      const messages = [...prev];
      while (
        messages.length > 0 &&
        (messages[messages.length - 1]?.isLoading ||
          messages[messages.length - 1]?.isBot)
      ) {
        messages.pop();
      }
      return messages;
    });
  }, [openaiMutation, anthropicMutation, mistralMutation, googleMutation]);

  const handleSkipAnimation = useCallback(async () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = undefined;
    }

    setIsTyping(false);
    setStopTyping(false);

    setMessages((prev) => {
      const messages = [...prev];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isBot && lastMessage.fullText) {
        messages[messages.length - 1] = {
          ...lastMessage,
          text: lastMessage.fullText,
          isTyping: false,
        };
      }
      return messages;
    });

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isBot && lastMessage.fullText) {
      try {
        await saveMessageMutation.mutateAsync({
          content: lastMessage.fullText,
          isBot: true,
          modelId: Number(id),
        });

        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "message",
              "getModelMessages",
              { modelId: Number(id) },
            ],
          });
        }, 1000);
        refreshDailyMessages();

        // Ne pas invalider le cache pour éviter que les anciens messages réapparaissent
        // Le message est déjà affiché en local et sauvegardé en DB
      } catch (err) {
        console.error("Error saving bot message:", err);
      }
    }
  }, [
    saveMessageMutation,
    messages,
    id,
    refreshDailyMessages,
    queryClient,
  ]);

  const handleMessagesClear = useCallback(async () => {
    try {
      // Bloquer l'input pendant le clear
      setIsClearing(true);

      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = undefined;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setIsLoading(false);
      setIsTyping(false);
      setStopTyping(false);
      isStoppedRef.current = false;

      setMessages([]);
      setVersion((v) => v + 1);
      setJustCleared(true);
      setIsRefetchingAfterClean(true);

      // En prod, attendre un peu plus longtemps pour éviter les race conditions
      if (process.env.NODE_ENV === "production") {
        await new Promise((res) => setTimeout(res, 200));
      }

      await toast.promise(
        clearMessagesMutation.mutateAsync({ modelId: Number(id) }),
        {
          loading: "Effacement de la conversation...",
          success: "Conversation effacée avec succès",
          error:
            "Une erreur est survenue lors de l'effacement de la conversation. Veuillez réessayer, si l'erreur persiste merci de nous en informer dans le centre d'aide.",
        },
      );

      await queryClient.removeQueries({
        queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
        exact: true,
      });

      await new Promise((res) => setTimeout(res, 100));

      await queryClient.invalidateQueries({
        queryKey: ["userModels", "getModelById", { id: Number(id) }],
      });

      // Débloquer l'input après le clear
      setIsClearing(false);
    } catch (err) {
      console.error("Error clearing messages:", err);
      await queryClient.invalidateQueries({
        queryKey: ["message", "getModelMessages", { modelId: Number(id) }],
      });
    } finally {
      setIsRefetchingAfterClean(false);
      setIsClearing(false); // Débloquer l'input même en cas d'erreur
    }
  }, [
    clearMessagesMutation,
    id,
    queryClient,
  ]);

  // Remettre justCleared à false quand on change de chat
  useEffect(() => {
    setJustCleared(false);
  }, [id]);

  // justCleared sera réinitialisé seulement quand on envoie un nouveau message
  // Plus de timer automatique !

  const handleSendMessage = useCallback(
    async (message: string, options: { document?: DocumentType }) => {
      // 🔥 CORRECTION : Ne pas remettre justCleared à false immédiatement
      // Attendre que le message soit envoyé pour éviter le rechargement des messages supprimés
      if (!model) {
        throw new Error("Modèle non trouvé");
      }

      if (!message.trim()) return;

      try {
        setIsLoading(true);
        setStopTyping(false);
        isStoppedRef.current = false;

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const userMessage: MessageType = {
          isBot: false,
          text: message,
          document: options.document
            ? {
                title: options.document.title,
                content: options.document.content,
                url: undefined,
              }
            : undefined,
          timestamp: Date.now(), // Ajouter un timestamp pour la fusion intelligente
        };
        setMessages((prev) => [...prev, userMessage]);

        const userDoc = options.document;
        const hasValidUserDoc =
          !!userDoc &&
          typeof userDoc.title === "string" &&
          userDoc.title.trim().length > 0 &&
          typeof userDoc.content === "string" &&
          userDoc.content.trim().length > 0;

        await saveMessageMutation.mutateAsync({
          content: message,
          isBot: false,
          modelId: Number(id),
          document: hasValidUserDoc
            ? {
                title: userDoc.title,
                content: userDoc.content,
                url: undefined,
              }
            : undefined,
        });

        // 🔥 CORRECTION : Remettre justCleared à false seulement après la sauvegarde
        // Cela évite le rechargement des messages supprimés
        setJustCleared(false);

        setMessages((prev) => [
          ...prev,
          {
            isBot: true,
            text: "",
            isLoading: true,
            fullText: "",
            isTyping: false,
          },
        ]);

        let response: ChatResponse;
        try {
          const isImage = options.document?.mimeType?.startsWith("image/");
          const hasValidDoc =
            !!options.document &&
            typeof options.document.title === "string" &&
            typeof options.document.content === "string" &&
            options.document.title.length > 0 &&
            options.document.content.length > 0;

          const apiParams = {
            question: message,
            modelId: ((model as ChatModel)?.id as number) || 0,
            isAnExpert: Boolean((model as ChatModel)?.isAnExpert),
            isStoreChat: false,
            storeChatId: undefined,
            document:
              !isImage && hasValidDoc
                ? {
                    title: options.document!.title,
                    content: options.document!.content,
                    mimeType: options.document!.mimeType as
                      | "application/pdf"
                      | "text/csv"
                      | "text/plain"
                      | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      | "application/rtf",
                  }
                : undefined,
            image: isImage ? options.document?.content : undefined,
          };

          if (isStoppedRef.current) {
            setIsTyping(false);
            setIsLoading(false);
            return;
          }

          if ((model as ChatModel)?.provider === "openai") {
            response = await openaiMutation.mutateAsync(apiParams);
          } else if ((model as ChatModel)?.provider === "anthropic") {
            response = await anthropicMutation.mutateAsync(apiParams);
          } else if ((model as ChatModel)?.provider === "mistral") {
            response = await mistralMutation.mutateAsync(apiParams);
          } else if ((model as ChatModel)?.provider === "google") {
            response = await googleMutation.mutateAsync(apiParams);
          }
          // else if ((model as ChatModel)?.provider === "clara") {
          //   response = await claraMutation.mutateAsync(apiParams);
          // }
          else {
            throw new Error("Provider non supporté");
          }

          if (isStoppedRef.current) {
            setIsTyping(false);
            setIsLoading(false);
            setMessages((prev) => {
              const messages = [...prev];
              if (
                messages.length > 0 &&
                messages[messages.length - 1]?.isLoading
              ) {
                messages.pop();
              }
              return messages;
            });
            return;
          }

          if (response && !isStoppedRef.current) {
            const answer = response.answer;

            if (isStoppedRef.current) {
              setIsTyping(false);
              setIsLoading(false);
              setMessages((prev) => {
                const messages = [...prev];
                if (
                  messages.length > 0 &&
                  messages[messages.length - 1]?.isLoading
                ) {
                  messages.pop();
                }
                return messages;
              });
              return;
            }

            // 🔥 SAUVEGARDE IMMÉDIATE de la réponse de l'IA
            // Sauvegarder immédiatement la réponse avant l'animation de frappe

            try {
              const firstDoc = response.documents?.[0];
              const hasValidDoc =
                !!firstDoc &&
                typeof firstDoc.title === "string" &&
                firstDoc.title.trim().length > 0 &&
                typeof firstDoc.content === "string" &&
                firstDoc.content.trim().length > 0;

              void saveMessageMutation.mutateAsync({
                content: answer,
                isBot: true,
                modelId: Number(id),
                document: hasValidDoc
                  ? {
                      title: firstDoc.title,
                      content: firstDoc.content,
                      url: undefined,
                    }
                  : undefined,
              });
            } catch (err) {
              console.error("❌ Erreur lors de la sauvegarde immédiate:", err);
            }

            setIsTyping(true);
            setMessages((prev) => {
              const messages = [...prev];
              if (
                messages.length > 0 &&
                messages[messages.length - 1]?.isLoading
              ) {
                messages.pop();
              }
              messages.push({
                isBot: true,
                text: "",
                isLoading: false,
                fullText: answer,
                isTyping: true,
                timestamp: Date.now(), // Ajouter un timestamp pour la fusion intelligente
                document: response.documents?.[0]
                  ? {
                      title: response.documents[0].title,
                      content: response.documents[0].content,
                      url: undefined,
                    }
                  : undefined,
              });
              return messages;
            });

            let currentText = "";
            const chars = answer.split("");
            let charIndex = 0;

            if (typeIntervalRef.current) {
              clearInterval(typeIntervalRef.current);
              typeIntervalRef.current = undefined;
            }

            setIsLoading(false);
            await new Promise((r) => setTimeout(r, 0));

            const interval = setInterval(() => {
              if (isStoppedRef.current || stopTyping) {
                clearInterval(interval);
                typeIntervalRef.current = undefined;
                setIsTyping(false);
                setStopTyping(false);
                setMessages((prev) => {
                  const messages = [...prev];
                  if (
                    messages.length > 0 &&
                    messages[messages.length - 1]?.isBot
                  ) {
                    messages.pop();
                  }
                  return messages;
                });
                return;
              }

              if (charIndex < chars.length) {
                currentText += chars[charIndex];
                setMessages((prev) => {
                  const messages = [...prev];
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage && lastMessage.isBot) {
                    messages[messages.length - 1] = {
                      ...lastMessage,
                      text: currentText,
                      isTyping: true,
                    };
                  }
                  return messages;
                });
                charIndex++;
              } else {
                clearInterval(interval);
                typeIntervalRef.current = undefined;
                setMessages((prev) => {
                  const messages = [...prev];
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage && lastMessage.isBot) {
                    messages[messages.length - 1] = {
                      ...lastMessage,
                      text: currentText,
                      isTyping: false,
                    };
                  }
                  return messages;
                });
                setIsTyping(false);

                // 🔥 SAUVEGARDE DÉJÀ FAITE - Plus besoin de sauvegarder ici
                // La réponse a été sauvegardée immédiatement après réception
                // NE PAS invalider le cache pour éviter la duplication des messages utilisateur
                // Les messages sont déjà synchronisés localement
                refreshDailyMessages();
              }
            }, 30);

            typeIntervalRef.current = interval;
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            console.log("Requête annulée");
            setMessages((prev) => prev.slice(0, -1));
          } else {
            setMessages((prev) => prev.slice(0, -1));
          }
          setIsLoading(false);
          setIsTyping(false);
          setStopTyping(false);
        } finally {
          if (!stopTyping) {
            setIsLoading(false);
          }
          abortControllerRef.current = null;
        }
      } catch (error) {
        console.error("Error in handleSendMessage:", error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Une erreur est survenue lors de l'envoi du message");
        }
        setMessages((prev) => prev.slice(0, -1));
      }
    },
    [
      model,
      openaiMutation,
      anthropicMutation,
      mistralMutation,
      googleMutation,
      saveMessageMutation,
      id,
      stopTyping,
      refreshDailyMessages,
    ],
  );

  // Optimisation du rendu
  const currentMessage = useMemo(
    () => messages[messages.length - 1]?.text || "",
    [messages],
  );

  if (isModelLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <SecondaryLoader size="lg" />
      </div>
    );
  }

  // Vérifier que nous sommes côté client après tous les hooks
  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <SecondaryLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ChatHeader
        model={model}
        isOpen={isOpen}
        onClearMessages={handleMessagesClear}
        canClear={messages.length > 0 && !justCleared}
      />

      <div className="chat-messages-container min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden pb-20">
          <div className="mx-auto w-full max-w-5xl px-2 py-4 sm:px-4 sm:py-6">
            <ChatContent
              key={id?.toString() + "-" + version}
              messages={justCleared || isRefetchingAfterClean ? [] : messages}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-base-content/5 bg-base-200/25 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-2 py-3 sm:px-4 sm:py-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading || isClearing}
            setIsLoading={setIsLoading}
            mode="chat"
            SelectedModel={
              (model as ChatModel)?.isTemplate
                ? ((model as ChatModel)?.chatName as string) || ""
                : ((model as ChatModel)?.name as string) || ""
            }
            modelId={((model as ChatModel)?.id as number)?.toString() || ""}
            onModeChange={() => {}}
            onStopResponse={handleStopResponse}
            typingStatus={isTyping}
            setIsTyping={setIsTyping}
            onSkipAnimation={handleSkipAnimation}
            onMessagesClear={handleMessagesClear}
            addMessage={(message: MessageType) =>
              setMessages((prev) => [...prev, message])
            }
            removeMessage={() =>
              setMessages((prev) => prev.slice(0, prev.length - 1))
            }
            messages={justCleared ? [] : messages}
            currentMessage={currentMessage}
            onSimplify={() => {}}
            onUploadFile={() => {}}
            isAgent={(model as ChatModel)?.isAnExpert as boolean}
            isOpen={isOpen}
            isSpeedCreate={false}
            justCleared={justCleared}
          />
        </div>
      </div>
    </div>
  );
});

ChatPage.displayName = "ChatPage";
/////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
export default ChatPage;
/////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
