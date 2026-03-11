/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import axios from "axios";
import { settingsManager } from "~/server/api/routers/Settings/settingsManager";
import { AccessControlService } from "~/server/services/accessControl";
import PDFParser from "pdf2json";
import { log, LogLevel } from "~/globalUtils/debug";
import { getLastExchanges } from "../Services/getLastExchanges";
import { executeWithRateLimit } from "~/server/services/apiRateLimiter";
import { AxiosResponse } from "axios";
import { env } from "~/env.js";
/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

// Fonction utilitaire pour formater les sources RAGclear[TEST] Fix scroll chat page
function formatRAGSources(docs: any[]): string {
  if (!docs || docs.length === 0) return "";
  return docs
    .map((d, index) => {
      const title = d.title || d.name || "Document";
      const page = d.pageNumber ?? "?";
      const content =
        (d.content || d.text || "")
          ?.slice(0, 300)
          .replace(/\n+/g, " ")
          .trim() || "";

      return `**${index + 1}.** **${title}** (page ${page})\n\n> ${content}...`;
    })
    .join("\n\n");
}
/////////////////////////////////////////////////////////////////////////////////TYPES//////////////////////////////////////////////////////////////////////////////////////
interface MistralOCRPage {
  index: number;
  markdown: string;
}

interface DocumentContent {
  title: string;
  content: string;
  mimeType: string;
}

import { documentInputSchema } from "./types";
/////////////////////////////////////////////////////////////////////////////////TYPES//////////////////////////////////////////////////////////////////////////////////////

const withTimeout = async <T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage: string,
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

// Fonction pour détecter une URL dans le texte
const extractUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

export const anthropicRouter = createTRPCRouter({
  ask: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        modelId: z.number(),
        isAnExpert: z.boolean(),
        isStoreChat: z.boolean().optional(),
        storeChatId: z.number().optional(),
        document: documentInputSchema.optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: {
          question,
          modelId,
          isAnExpert,
          isStoreChat,
          storeChatId,
          document,
          image,
        },
      }) => {
        // Vérifier les limites dynamiques
        const userId = session.user.id;
        const accessControl = await AccessControlService.canSendMessage(userId);

        if (!accessControl.canSend) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: accessControl.reason || "Limite de messages atteinte",
          });
        }

        //TODO: Vérifier si l'utilisateur a deposer un document temporaire
        let documentContent: DocumentContent | null = null;
        if (document?.content) {
          try {
            const dataBuffer = Buffer.from(document.content, "base64");
            let text = "";

            switch (document.mimeType) {
              case "application/pdf":
                // Traitement PDF
                try {
                  const pdfParser = new PDFParser(undefined, true);
                  text = await withTimeout(
                    new Promise<string>((resolve, reject) => {
                      pdfParser.on("pdfParser_dataError", (err) => {
                        log(
                          LogLevel.DEBUG,
                          `Échec de l'extraction simple du texte:${err}`,
                        );
                        reject(err);
                      });
                      pdfParser.on("pdfParser_dataReady", () => {
                        const extractedText = pdfParser
                          .getRawTextContent()
                          .trim();
                        if (extractedText && extractedText.length > 0) {
                          resolve(extractedText);
                        } else {
                          reject(new Error("Aucun texte extrait"));
                        }
                      });
                      pdfParser.parseBuffer(dataBuffer);
                    }),
                    Number(await settingsManager.get("pdfParser_timeout")),
                    "L'extraction du texte prend trop de temps",
                  );
                } catch (pdfError) {
                  log(LogLevel.DEBUG, `Échec de l'extraction PDF: ${pdfError}`);

                  // Fallback avec Mistral OCR
                  try {
                    if (!process.env.MISTRAL_API_KEY) {
                      throw new Error("MISTRAL_API_KEY non configurée");
                    }

                    const response = await axios.post(
                      "https://api.mistral.ai/v1/ocr",
                      {
                        model: "mistral-ocr-latest",
                        document: {
                          type: "document_url",
                          document_url: `data:application/pdf;base64,${document.content}`,
                        },
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                          "Content-Type": "application/json",
                        },
                      },
                    );

                    // Concaténer le texte de toutes les pages
                    text = response.data.pages
                      .map((page: MistralOCRPage) => page.markdown)
                      .join("\n\n");

                    if (!text.trim()) {
                      throw new Error("Aucun texte extrait par l'OCR");
                    }
                  } catch (ocrError) {
                    log(LogLevel.DEBUG, `Échec de l'OCR Mistral: ${ocrError}`);
                    throw new Error(
                      "Impossible d'extraire le texte du PDF (parsing et OCR ont échoué)",
                    );
                  }
                }
                break;

              case "text/csv":
              case "text/plain":
                // Pour CSV et TXT, on utilise directement le contenu
                text = dataBuffer.toString("utf-8");
                break;

              case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                // Pour DOCX, on utilise mammoth pour extraire le texte
                const mammoth = await import("mammoth");
                const result = await mammoth.extractRawText({
                  buffer: dataBuffer,
                });
                text = result.value;
                break;

              case "application/rtf":
                // Pour RTF, on lit le contenu brut
                text = dataBuffer.toString("utf-8");
                // On nettoie le contenu RTF en enlevant les commandes RTF
                text = text
                  .replace(/\\[a-z0-9]+/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
                break;

              default:
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Format de fichier non supporté",
                });
            }

            if (!text.trim()) {
              throw new Error("Aucun texte extrait");
            }

            documentContent = {
              title: document.title || "Document sans titre",
              content: text,
              mimeType: document.mimeType || "text/plain",
            };
          } catch (error) {
            console.error("Erreur lors du traitement du document:", error);
            let errorMessage = "Impossible de lire ce document.";
            if (error instanceof Error) {
              if (error.message.includes("trop de temps")) {
                errorMessage =
                  "Le traitement du document prend trop de temps. Essayez un document plus petit.";
              } else if (error.message === "Aucun texte extrait") {
                errorMessage =
                  "Impossible d'extraire du texte de ce document. Il est peut-être corrompu ou vide.";
              }
            }
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errorMessage,
            });
          }
        }
        // TODO: recuperer le modele avant de lancer la requete vers api esclave
        const model = await db.models.findUnique({
          where: { id: modelId },
          include: {
            modelNameRelation: {
              select: {
                provider: true,
                useOnlyHumanMessage: true,
                maxInputTokens: true,
                maxOutputTokens: true,
                value: true,
              },
            },
          },
        });
        if (!model) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modèle non trouvé",
          });
        }

        // Paralléliser les requêtes DB pour optimiser les performances
        const [systemPrompt, user, { lastExchanges }] =
          await Promise.all([
            // Récupération du prompt système
            isAnExpert
              ? (settingsManager.get(
                  "LLM_SystemPrompt_Expert",
                ) as Promise<string>)
              : (settingsManager.get(
                  "LLM_SystemPrompt_Agent",
                ) as Promise<string>),

            // Récupérer les informations utilisateur pour le prompt
            db.user.findUnique({
              where: { id: userId },
              select: {
                firstName: true,
                lastName: true,
                accountType: true,
              },
            }),

            // Récupération des derniers échanges
            getLastExchanges(
              userId,
              isStoreChat ? storeChatId!.toString() : modelId.toString(),
              10,
              isStoreChat,
            ),
          ]);

        // Récupération des variables de prompt
        const promptVariables = {
          modelPrompt: model.prompt || "",
          lastExchange: lastExchanges,
          temporaryDocumentContext: documentContent
            ? JSON.stringify(documentContent)
            : "",
          webSearch: "",
          question: question,
          crlf: "\n",
          modelName: model.name || "",
          userName:
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : "Utilisateur",
          rag: "", // Sera rempli par formatRAGSources
        };

        // 🔥 Les documents RAG viennent de l'API Python (response.data.documents)
        // => L'injection initiale est vide, les vrais docs sont injectés après l'appel API
        promptVariables.rag = "";

        // Remplacer les variables dans le prompt système
        let formattedSystemPrompt = systemPrompt;
        Object.entries(promptVariables).forEach(([key, value]) => {
          formattedSystemPrompt = formattedSystemPrompt.replace(
            new RegExp(`{${key}}`, "g"),
            value,
          );
        });

        // Détecter l'URL dans le message
        const detectedUrl = extractUrl(question);

        // Si une URL est détectée, on la retire du message
        const cleanQuestion = detectedUrl
          ? question.replace(detectedUrl, "").trim()
          : question;

        const makeApiCall = async (endpoint: string, signal: AbortSignal) => {
          try {
            if (
              !process.env.ARCHIBALD_API_URL ||
              !process.env.ARCHIBALD_API_KEY
            ) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Configuration d'Archibald manquante",
              });
            }

            const apiUrl = process.env.ARCHIBALD_API_URL.startsWith("http")
              ? process.env.ARCHIBALD_API_URL
              : `http://${process.env.ARCHIBALD_API_URL}`;

            // Utiliser le rate limiter pour l'appel API Python
            const response = await executeWithRateLimit<AxiosResponse>(
              () =>
                axios.post(
                  `${apiUrl}${endpoint}`,
                  {
                    question: cleanQuestion,
                    provider: model.provider,
                    ProviderModel: model.modelNameRelation.value,
                    modelId: model.id,
                    document: documentContent,
                    systemPrompt: formattedSystemPrompt,
                    userPrompt: model.prompt,
                    image: image,
                    url: detectedUrl,
                    maxInputTokens: model.modelNameRelation.maxInputTokens,
                    maxOutputTokens: Math.min(
                      model.modelNameRelation.maxOutputTokens,
                      100_000,
                    ),
                    promptVariables,
                    userAccountType: user?.accountType || "",
                  },
                  {
                    headers: {
                      "X-API-Key": process.env.ARCHIBALD_API_KEY,
                      "Content-Type": "application/json",
                    },
                    signal: signal,
                  },
                ),
              90000, // 90 secondes timeout
            );

            // Vérifier si la requête a été annulée
            if (signal.aborted) {
              throw new TRPCError({
                code: "CLIENT_CLOSED_REQUEST",
                message: "La génération a été arrêtée par l'utilisateur",
              });
            }

            // Gérer le cas de surcharge (code 202)
            if (response.status === 202) {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message:
                  response.data.message +
                  "temps d'attente estimé : " +
                  response.data.estimatedWait,
              });
            }

            console.log("Réponse complète de l'API Python:", response.data);

            // Si l'API Python renvoie des documents RAG pertinents → reformater
            if (response.data.documents && response.data.documents.length > 0) {
              promptVariables.rag = formatRAGSources(response.data.documents);

              // 🔥 Reformatage du prompt système avec les vrais documents RAG
              formattedSystemPrompt = systemPrompt;
              Object.entries(promptVariables).forEach(([key, value]) => {
                formattedSystemPrompt = formattedSystemPrompt.replace(
                  new RegExp(`{${key}}`, "g"),
                  value,
                );
              });
            }

            // Incrémenter le compteur de messages via AccessControlService
            await AccessControlService.incrementMessageCount(userId);

            if (!response.data.answer) {
              console.error("Réponse invalide de l'API Python:", response.data);
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "La réponse de l'API ne contient pas de réponse",
              });
            }

            // S'assurer que tous les champs nécessaires sont présents
            // Formater la réponse avec les citations séparées
            let finalAnswer = response.data.answer;
            let citations = "";

            // Si il y a des documents RAG, ajouter les citations à la fin
            if (response.data.documents && response.data.documents.length > 0) {
              citations =
                "\n\n---\n\n## 📚 Sources\n\n" +
                formatRAGSources(response.data.documents);
              finalAnswer = response.data.answer + citations;
            }

            const formattedResponse = {
              answer: finalAnswer,
              sources: response.data.sources || [],
              documents: response.data.documents || [],
              document: response.data.document || null,
              isTyping: true,
              fullText: finalAnswer,
              isLoading: false,
            };

            if (env.NODE_ENV === "development") {
              console.log("Réponse formatée:", formattedResponse);
              console.log(
                "Réponse du bot :",
                response.data.answer,
                "Longueur :",
                response.data.answer.length,
              );
            }

            return formattedResponse;
          } catch (error) {
            console.error("Erreur API esclave:", error);

            const errorMessage =
              error instanceof Error ? error.message : "Erreur inconnue";
            let clearMessage = "Erreur lors de la génération de la réponse";

            // Messages d'erreur clairs selon le type d'erreur
            if (axios.isAxiosError(error)) {
              if (error.code === "ERR_CANCELED") {
                throw new TRPCError({
                  code: "CLIENT_CLOSED_REQUEST",
                  message: "La génération a été arrêtée par l'utilisateur",
                });
              }

              if (error.response?.status === 401) {
                clearMessage =
                  "Erreur d'authentification API - Clé API invalide";
              } else if (error.response?.status === 429) {
                clearMessage =
                  "Limite de requêtes API dépassée - Veuillez patienter";
              } else if (error.response?.status === 500) {
                clearMessage =
                  "Erreur serveur API - Service temporairement indisponible";
              } else if (error.response?.status === 503) {
                clearMessage = "Service API temporairement indisponible";
              } else if (error.code === "ECONNREFUSED") {
                clearMessage = "Impossible de se connecter au service API";
              } else if (error.code === "ETIMEDOUT") {
                clearMessage =
                  "Délai d'attente dépassé - Le service met trop de temps à répondre";
              } else {
                clearMessage = error.response?.data?.message || error.message;
              }

              throw new TRPCError({
                code:
                  error.response?.status === 202
                    ? "TOO_MANY_REQUESTS"
                    : "INTERNAL_SERVER_ERROR",
                message: clearMessage,
              });
            } else if (errorMessage.includes("timeout")) {
              clearMessage =
                "Délai d'attente dépassé - Le service met trop de temps à répondre";
            } else if (errorMessage.includes("network")) {
              clearMessage = "Erreur de connexion réseau";
            } else if (errorMessage.includes("permission")) {
              clearMessage =
                "Permissions insuffisantes pour accéder au service";
            }

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: clearMessage,
            });
          }
        };
        // Créer un AbortController avec timeout de 90 secondes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 secondes

        try {
          if (!model.isAnExpert) {
            return await makeApiCall("/anthropic/agent", controller.signal);
          } else {
            return await makeApiCall("/anthropic/expert", controller.signal);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      },
    ),
});
