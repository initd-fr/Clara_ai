// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { testMinioConnection, reconnectMinio, getMinio } from "~/server/db";
import { emitProgress } from "~/server/shared/progressBridge";
import { processFileAfterUpload } from "~/server/api/routers/Files/buckets";
// PgRawPool n'est plus utilisé directement, remplacé par embeddingsService
import { AccessControlService } from "~/server/services/accessControl";
import { embeddingsService } from "~/server/api/routers/chat/ModelsPerso/Services/embeddings";

// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

// Helper optimisé pour les opérations PostgreSQL avec gestion d'erreur
// withPostgresConnection n'est plus utilisé, remplacé par embeddingsService.processOptimizedBatchUpdate

// TODO Helper pour supprimer un batch de fichiers avec retry
const deleteMinioBatch = async (bucketName: string, batch: string[]) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await Promise.race([
        getMinio().removeObjects(bucketName, batch),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout suppression fichiers")),
            30000,
          ),
        ),
      ]);
      return;
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du batch (tentative ${retryCount + 1}/${maxRetries}):`,
        error,
      );
      retryCount++;
      if (retryCount === maxRetries) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Échec de la suppression des fichiers après plusieurs tentatives",
          cause: error,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 5000 * retryCount));
    }
  }
};

// TODO Helper pour vérifier si un bucket est vide
const isBucketEmpty = async (bucketName: string): Promise<boolean> => {
  try {
    const objects = await getMinio().listObjects(bucketName, "", true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of objects) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du contenu du bucket:",
      error,
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de vérifier le contenu du bucket",
      cause: error,
    });
  }
};
// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

interface ProcessedFile {
  name: string;
  embeddings: number[][];
  segments: Array<{
    pageContent: string;
    metadata?: {
      pageNumber?: number;
    };
  }>;
}

export const UserModelsRouter = createTRPCRouter({
  // TODO: Création d'un agent avec gestion des tâches et suivi de progression
  createAnAgent: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        prompt: z.string(),
        modelName: z.string(),
        isAnExpert: z.boolean(),
        provider: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userId = session.user.id;
      const taskId = `create-agent-${Date.now()}`;

      // Événement de début
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Début de la création de l'agent",
        progress: 0,
        done: false,
      });

      // App locale : pas de vérification de permissions
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Création du modèle en base",
        progress: 50,
        done: false,
      });

      try {
        const newModel = await db.models.create({
          data: {
            name: input.name,
            prompt: input.prompt,
            modelName: input.modelName,
            provider: input.provider,
            userId: userId,
            isAnExpert: input.isAnExpert,
            bucketName: "",
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Enregistrement des logs",
          progress: 80,
          done: false,
        });

        // Création du log de succès
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            modelType: "AGENT",
            modelId: newModel.id,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: `Création réussie de l'agent "${input.name}"`,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Agent créé avec succès",
          progress: 100,
          done: true,
        });

        return { ...newModel, taskId };
      } catch (error) {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Erreur lors de la création de l'agent",
          progress: 0,
          done: false,
          error: (error as Error).message,
        });

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la création de l'agent";

        // Messages d'erreur clairs selon le type d'erreur
        if (errorMessage.includes("Unique constraint")) {
          clearMessage = "Un agent avec ce nom existe déjà";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour créer l'agent";
        } else if (errorMessage.includes("validation")) {
          clearMessage = "Données invalides pour la création de l'agent";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "AGENT",
            modelId: 0,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
        });
      }
    }),
  // TODO: Mise à jour des paramètres d'un agent
  updateAnAgent: protectedProcedure
    .input(
      z.object({
        modelId: z.number(),
        name: z.string().optional(),
        prompt: z.string().optional(),
        modelName: z.string().optional(),
        provider: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userId = session.user.id;
      const taskId = `update-agent-${Date.now()}`;

      // Événement de début
      emitProgress({
        userId,
        taskId,
        type: "update",
        step: "Début de la mise à jour de l'agent",
        progress: 0,
        done: false,
      });

      try {
        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Vérification du modèle",
          progress: 20,
          done: false,
        });

        // Vérification d'existence du modèle et autorisation en une seule requête
        const model = await db.models.findUnique({
          where: {
            id: input.modelId,
            userId: session.user.id, // S'assure que le modèle appartient à l'utilisateur
          },
          select: {
            id: true, // Select minimal des champs nécessaires
            name: true,
            prompt: true,
            modelName: true,
            provider: true,
          },
        });

        if (!model) {
          emitProgress({
            userId,
            taskId,
            type: "update",
            step: "Erreur: Modèle non trouvé",
            progress: 0,
            done: false,
            error:
              "L'agent n'existe pas ou vous n'avez pas les droits pour le modifier",
          });

          // Log de l'erreur de non trouvé
          await db.userLogs.create({
            data: {
              userId: session.user.id,
              action: "WARNING",
              modelType: "AGENT",
              modelId: 0,
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              email: session.user.email,
              description:
                "Erreur lors d'un tentative de mise à jour d'un agent car il n'existe pas en base de données",
            },
          });

          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "L'agent n'existe pas ou vous n'avez pas les droits pour le modifier !",
          });
        }

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Préparation des données",
          progress: 40,
          done: false,
        });

        // Préparation des données à mettre à jour
        const updateData = {
          ...(input.name && { name: input.name }),
          ...(input.prompt && { prompt: input.prompt }),
          ...(input.modelName && { modelName: input.modelName }),
          ...(input.provider && { provider: input.provider }),
          updatedAt: new Date(), // Mise à jour automatique du timestamp
        };

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Mise à jour en base",
          progress: 60,
          done: false,
        });

        // Mise à jour avec optimisation des performances
        const updatedModel = await db.models.update({
          where: {
            id: input.modelId,
          },
          data: updateData,
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Enregistrement des logs",
          progress: 80,
          done: false,
        });

        // Création du log de succès
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "UPDATE",
            modelType: "AGENT",
            modelId: input.modelId,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: `Mise à jour réussie de l'agent "${input.name}"`,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Agent mis à jour avec succès",
          progress: 100,
          done: true,
        });

        return {
          success: true,
          model: updatedModel,
        };
      } catch (error) {
        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Erreur lors de la mise à jour de l'agent",
          progress: 0,
          done: false,
          error: (error as Error).message,
        });

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la mise à jour de l'agent";

        // Messages d'erreur clairs selon le type d'erreur
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("not found")
        ) {
          clearMessage = "Agent non trouvé ou accès non autorisé";
        } else if (errorMessage.includes("Unique constraint")) {
          clearMessage = "Un agent avec ce nom existe déjà";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour modifier l'agent";
        } else if (errorMessage.includes("validation")) {
          clearMessage = "Données invalides pour la mise à jour de l'agent";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "AGENT",
            modelId: 0,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
        });
      }
    }),
  // & Create an Expert Model
  createAnExpert: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        prompt: z.string(),
        modelName: z.string(),
        isAnExpert: z.boolean(),
        provider: z.string(),
        files: z
          .array(
            z.object({
              name: z.string(),
              content: z.string(),
              size: z.number(),
            }),
          )
          .min(1, "Au moins un fichier est requis pour créer un expert"),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userId = session.user.id;
      const taskId = `create-expert-${Date.now()}`;

      // Événement de début
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Début de la création de l'expert",
        progress: 0,
        done: false,
      });

      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Vérification des permissions",
        progress: 5,
        done: false,
      });

      // App locale : pas de vérification de permissions ni de limites de stockage

      // Préparation du bucketName
      const bucketName = `model-${userId}-${Date.now()}`;

      // Vérification de la connexion MinIO avec retries
      const maxRetries = 3;
      let retryCount = 0;
      let isConnected = false;

      while (retryCount < maxRetries && !isConnected) {
        try {
          isConnected = await testMinioConnection();
          if (!isConnected) {
            await reconnectMinio();
            isConnected = await testMinioConnection();
          }
          break;
        } catch (error) {
          console.error(
            `Tentative ${retryCount + 1} de connexion MinIO échouée:`,
            error,
          );
          retryCount++;
          if (retryCount === maxRetries) {
            emitProgress({
              userId,
              taskId,
              type: "create",
              step: "Erreur: Impossible de se connecter à MinIO",
              progress: 0,
              done: false,
              error:
                "Impossible de se connecter à MinIO après plusieurs tentatives",
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Impossible de se connecter à MinIO après plusieurs tentatives.",
            });
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 5000 * retryCount),
          );
        }
      }

      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Connexion à MinIO",
        progress: 15,
        done: false,
      });

      // Création du bucket
      try {
        const bucketExists = await getMinio().bucketExists(bucketName);
        if (!bucketExists) {
          await getMinio().makeBucket(bucketName);
        }
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Création du bucket MinIO",
          progress: 20,
          done: false,
        });
      } catch (error) {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Erreur: Création du bucket échouée",
          progress: 0,
          done: false,
          error: "Erreur lors de la création du bucket modèle",
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du bucket modèle.",
        });
      }

      // Traitement des fichiers et création des embeddings
      const processedFiles: ProcessedFile[] = [];
      let newModel: { id: number } | undefined;

      const cleanup = async () => {
        try {
          // Nettoyage du bucket MinIO
          const objectsList = [];
          for await (const obj of getMinio().listObjects(
            bucketName,
            "",
            true,
          )) {
            objectsList.push(obj.name);
          }
          if (objectsList.length > 0) {
            await getMinio().removeObjects(bucketName, objectsList);
          }
          await getMinio().removeBucket(bucketName);

          // Suppression du modèle si créé
          if (newModel?.id) {
            await db.models.delete({
              where: { id: newModel.id },
            });
          }

          // Suppression des documents si créés
          if (newModel?.id) {
            await db.document.deleteMany({
              where: { modelId: newModel.id },
            });
          }
        } catch (cleanupError) {
          console.error("Erreur lors du nettoyage:", cleanupError);
        }
      };

      try {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Création du modèle en base",
          progress: 25,
          done: false,
        });

        // Création du modèle en base de données avant le traitement des fichiers
        newModel = await db.models.create({
          data: {
            name: input.name,
            prompt: input.prompt,
            modelName: input.modelName,
            provider: input.provider,
            userId: userId,
            isAnExpert: input.isAnExpert,
            bucketName,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "create",
          step: `Traitement de ${input.files.length} fichier(s)`,
          progress: 30,
          done: false,
        });

        // Création du log de succès
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            modelType: "EXPERT",
            modelId: newModel.id,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: `Création réussie de l'expert "${input.name}" avec ${input.files.length} fichiers`,
          },
        });

        if (!newModel) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de la création du modèle",
          });
        }

        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          if (!file?.content || !file?.name) {
            emitProgress({
              userId,
              taskId,
              type: "create",
              step: "Erreur: Fichier invalide",
              progress: 0,
              done: false,
              error: `Fichier invalide à l'index ${i}`,
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Fichier invalide à l'index ${i}`,
            });
          }

          // Vérification du type de fichier (doit être PDF)
          if (!file.name.toLowerCase().endsWith(".pdf")) {
            emitProgress({
              userId,
              taskId,
              type: "create",
              step: "Erreur: Type de fichier invalide",
              progress: 0,
              done: false,
              error: `Le fichier ${file.name} n'est pas un PDF`,
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Le fichier ${file.name} n'est pas un PDF`,
            });
          }

          const fileBuffer = Buffer.from(file.content, "base64");

          // Traitement du fichier avec le vrai modelId et callback de progression
          const result = await processFileAfterUpload({
            name: file.name,
            pdfBuffer: fileBuffer,
            modelId: newModel.id,
            modelBucketName: bucketName,
            userId,
            onProgress: (progress, step) => {
              // Calculer la progression globale (30% à 90% pour le traitement des fichiers)
              const globalProgress = 30 + Math.round((progress / 100) * 60);
              emitProgress({
                userId,
                taskId,
                type: "create",
                step: `${file.name}: ${step}`,
                progress: globalProgress,
                done: false,
              });
            },
          });

          if (result.success && result.embeddings && result.segments) {
            processedFiles.push({
              name: file.name,
              embeddings: result.embeddings,
              segments: result.segments,
            });
          } else {
            emitProgress({
              userId,
              taskId,
              type: "create",
              step: "Erreur lors du traitement des fichiers",
              progress: 0,
              done: false,
              error: "Erreur lors du traitement des fichiers",
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erreur lors du traitement du fichier",
            });
          }
        }

        // Sauvegarde des embeddings en base de données
        if (!newModel?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ID du modèle non défini",
          });
        }

        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Sauvegarde des embeddings en base",
          progress: 90,
          done: false,
        });

        const modelId = newModel.id;
        const totalEmbeddings = processedFiles.reduce(
          (acc, file) => acc + file.embeddings.length,
          0,
        );
        let processedEmbeddings = 0;

        // Traitement optimisé par fichier avec batch inserts
        for (const file of processedFiles) {
          const fileStart = Date.now();
          console.log(
            `🚀 [PERF] Traitement fichier ${file.name}: ${file.embeddings.length} embeddings`,
          );

          // Validation des segments
          const validSegments = file.segments.filter((segment, index) => {
            if (!segment || !segment.pageContent) {
              console.warn(
                `[${file.name}] Segment invalide à l'index ${index}`,
              );
              return false;
            }
            return true;
          });

          if (validSegments.length !== file.embeddings.length) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Nombre de segments et d'embeddings ne correspond pas",
            });
          }

          // Batch insert optimisé - Créer tous les documents d'un coup
          const batchInsertStart = Date.now();
          console.log(
            `🚀 [PERF] Batch insert documents pour ${file.name}: ${validSegments.length} segments`,
          );

          await db.document.createMany({
            data: validSegments.map((segment, i) => ({
              name: file.name,
              text: segment.pageContent,
              modelId: modelId,
              minioPath: `${bucketName}/${file.name}`,
              mimeType: "application/pdf",
              size: 0, // La taille sera mise à jour lors de l'upload
              createdAt: new Date(),
              updatedAt: new Date(),
              segmentOrder: i,
              pageNumber: segment.metadata?.pageNumber ?? 1,
            })),
          });

          const batchInsertTime = Date.now() - batchInsertStart;
          console.log(
            `✅ [PERF] Batch insert terminé en ${batchInsertTime}ms pour ${validSegments.length} documents`,
          );

          // Récupérer les IDs des documents créés
          const createdDocuments = await db.document.findMany({
            where: {
              modelId: modelId,
              name: file.name,
              minioPath: `${bucketName}/${file.name}`,
            },
            select: { id: true, segmentOrder: true },
            orderBy: { segmentOrder: "asc" },
          });

          // Batch update des embeddings avec une seule connexion
          const batchUpdateStart = Date.now();
          console.log(
            `🚀 [PERF] Batch update embeddings pour ${file.name}: ${file.embeddings.length} embeddings`,
          );

          // Utilisation du service centralisé optimisé
          const batchUpdateResult =
            await embeddingsService.processOptimizedBatchUpdate(
              file.embeddings,
              createdDocuments,
              file.name,
              5, // chunkSize ultra-réduit pour DB distante
              2, // maxConcurrency réduit pour DB distante
            );

          if (!batchUpdateResult.success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erreur lors de la sauvegarde des embeddings",
            });
          }

          processedEmbeddings += file.embeddings.length;
          const progress = Math.round(
            90 + (processedEmbeddings / totalEmbeddings) * 10,
          );

          emitProgress({
            userId,
            taskId,
            type: "create",
            step: `Sauvegarde des embeddings (${processedEmbeddings}/${totalEmbeddings})`,
            progress: Math.min(99, progress),
            done: false,
          });

          const batchUpdateTime = Date.now() - batchUpdateStart;
          console.log(
            `✅ [PERF] Batch update embeddings terminé en ${batchUpdateTime}ms pour ${file.embeddings.length} embeddings`,
          );

          const fileTime = Date.now() - fileStart;
          console.error(
            `✅ [PERF] Fichier ${file.name} traité en ${fileTime}ms`,
          );
        }

        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Expert créé avec succès",
          progress: 100,
          done: true,
        });

        return { success: true, modelId: newModel.id };
      } catch (error) {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: "Erreur lors de la création de l'expert",
          progress: 0,
          done: false,
          error: (error as Error).message,
        });

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la création de l'expert";

        // Messages d'erreur clairs selon le type d'erreur
        if (errorMessage.includes("MinIO") || errorMessage.includes("bucket")) {
          clearMessage =
            "Erreur de connexion à MinIO - Impossible de créer le stockage";
        } else if (
          errorMessage.includes("PDF") ||
          errorMessage.includes("fichier")
        ) {
          clearMessage = "Erreur lors du traitement du document PDF";
        } else if (
          errorMessage.includes("embedding") ||
          errorMessage.includes("vector")
        ) {
          clearMessage = "Erreur lors de la création des embeddings";
        } else if (errorMessage.includes("Unique constraint")) {
          clearMessage = "Un expert avec ce nom existe déjà";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour créer l'expert";
        } else if (
          errorMessage.includes("storage") ||
          errorMessage.includes("limite")
        ) {
          clearMessage = "Limite de stockage dépassée";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "EXPERT",
            modelId: 0,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        await cleanup();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
          cause: error,
        });
      }
    }),
  // & Update an Expert Model
  updateAnExpert: protectedProcedure
    .input(
      z.object({
        modelId: z.number(),
        name: z.string().optional(),
        prompt: z.string().optional(),
        modelName: z.string().optional(),
        provider: z.string().optional(),
        categoryId: z.number().optional(),
        files: z
          .array(
            z.object({
              name: z.string(),
              content: z.string(),
              size: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userId = session.user.id;
      const taskId = `update-expert-${Date.now()}`;

      // Événement de début
      emitProgress({
        userId,
        taskId,
        type: "update",
        step: "Début de la mise à jour de l'expert",
        progress: 0,
        done: false,
      });

      try {
        // Vérification que le modèle existe et est un expert
        const model = await db.models.findUnique({
          where: {
            id: input.modelId,
            userId,
            isAnExpert: true,
            bucketName: { not: null },
          },
          select: {
            id: true,
            bucketName: true,
          },
        });

        if (!model?.bucketName) {
          // Log de l'erreur de non trouvé
          await db.userLogs.create({
            data: {
              userId: session.user.id,
              action: "WARNING",
              modelType: "EXPERT",
              modelId: 0,
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              email: session.user.email,
              description:
                "Erreur lors d'un tentative de mise à jour d'un expert car le bucket n'existe pas",
            },
          });

          emitProgress({
            userId,
            taskId,
            type: "update",
            step: "Erreur: Expert non trouvé",
            progress: 0,
            done: false,
            error: "Expert non trouvé ou accès non autorisé",
          });
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Expert non trouvé ou accès non autorisé",
          });
        }

        // Mise à jour des informations de base du modèle
        const updateData = {
          ...(input.name && { name: input.name }),
          ...(input.prompt && { prompt: input.prompt }),
          ...(input.modelName && { modelName: input.modelName }),
          ...(input.provider && { provider: input.provider }),
          updatedAt: new Date(),
        };

        await db.models.update({
          where: { id: input.modelId },
          data: updateData,
        });

        // Création du log de succès
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "UPDATE",
            modelType: "EXPERT",
            modelId: input.modelId,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: `Mise à jour réussie de l'expert "${input.name}"${input.files ? ` avec ${input.files.length} nouveaux fichiers` : ""}`,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Mise à jour des informations de base",
          progress: 20,
          done: false,
        });

        // Si des nouveaux fichiers sont fournis, les traiter
        if (input.files && input.files.length > 0) {
          const totalFilesStart = Date.now();
          console.log(
            `🚀 [PERF] Début traitement ${input.files.length} fichier(s) pour expert ${input.modelId}`,
          );

          // Log côté client pour debug
          emitProgress({
            userId,
            taskId,
            type: "update",
            step: `🚀 [PERF] Début traitement ${input.files.length} fichier(s)`,
            progress: 25,
            done: false,
          });
          // Vérification de la connexion MinIO
          const isConnected = await testMinioConnection();
          if (!isConnected) {
            const reconnected = await reconnectMinio();
            if (!reconnected) {
              emitProgress({
                userId,
                taskId,
                type: "update",
                step: "Erreur: Impossible de se connecter à MinIO",
                progress: 0,
                done: false,
                error: "Impossible de se connecter à MinIO",
              });
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Impossible de se connecter à MinIO.",
              });
            }
          }

          // Traitement des nouveaux fichiers

          for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            if (!file?.content || !file?.name) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Fichier invalide à l'index ${i}`,
              });
            }

            // Vérification du type de fichier (doit être PDF)
            if (!file.name.toLowerCase().endsWith(".pdf")) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Le fichier ${file.name} n'est pas un PDF`,
              });
            }

            const fileBuffer = Buffer.from(file.content, "base64");

            // Upload optimisé avec retry intelligent
            const uploadStart = Date.now();
            const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
            console.log(
              `🚀 [PERF] Upload MinIO ${file.name} (${fileSizeMB}MB) - Timeout: 2min`,
            );

            const maxRetries = 2; // Réduit de 3 à 2
            let retryCount = 0;
            let uploadSuccess = false;

            while (retryCount < maxRetries && !uploadSuccess) {
              try {
                const objectName = file.name;
                const uploadAttemptStart = Date.now();

                await Promise.race([
                  getMinio().putObject(
                    model.bucketName,
                    objectName,
                    fileBuffer,
                    {
                      "Content-Type": "application/pdf",
                      "x-amz-meta-size": fileBuffer.length.toString(),
                    } as unknown as number,
                  ),
                  new Promise((_, reject) =>
                    setTimeout(
                      () => reject(new Error("Timeout upload fichier")),
                      120000, // Réduit de 10 minutes à 2 minutes
                    ),
                  ),
                ]);

                const uploadAttemptTime = Date.now() - uploadAttemptStart;
                uploadSuccess = true;
                console.log(
                  `✅ [PERF] Upload réussi pour ${file.name} en ${uploadAttemptTime}ms après ${retryCount + 1} tentative(s)`,
                );
              } catch (error) {
                console.error(
                  `❌ [PERF] Tentative ${retryCount + 1} échouée pour ${file.name}:`,
                  error,
                );
                retryCount++;

                if (retryCount === maxRetries) {
                  const totalUploadTime = Date.now() - uploadStart;
                  console.error(
                    `💥 [PERF] Échec définitif upload ${file.name} après ${totalUploadTime}ms`,
                  );
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Échec de l'upload du fichier ${file.name} après ${maxRetries} tentatives`,
                  });
                }

                // Attente réduite entre les tentatives (2s, 4s)
                const retryDelay = 2000 * retryCount;
                console.log(
                  `⏳ [PERF] Retry ${file.name} dans ${retryDelay}ms`,
                );
                await new Promise((resolve) => setTimeout(resolve, retryDelay));

                // Vérifier et reconnecter MinIO si nécessaire
                const isConnected = await testMinioConnection();
                if (!isConnected) {
                  console.error(
                    `🔄 [PERF] Reconnexion MinIO pour ${file.name}`,
                  );
                  await reconnectMinio();
                }
              }
            }

            const totalUploadTime = Date.now() - uploadStart;
            console.log(
              `✅ [PERF] Upload total ${file.name} terminé en ${totalUploadTime}ms`,
            );

            // Log côté client pour debug
            emitProgress({
              userId,
              taskId,
              type: "update",
              step: `Fichier ${file.name} téléchargé avec succès`,
              progress: 40,
              done: false,
            });

            // Traitement du fichier une fois l'upload réussi
            if (uploadSuccess) {
              const processStart = Date.now();
              console.log(
                `🚀 [PERF] Début traitement PDF ${file.name} (${fileSizeMB}MB)`,
              );

              const result = await processFileAfterUpload({
                name: file.name,
                pdfBuffer: fileBuffer,
                modelId: input.modelId,
                modelBucketName: model.bucketName,
                userId,
                onProgress: (progress, step) => {
                  // Calculer la progression globale (20% à 90% pour le traitement des fichiers)
                  const globalProgress = 20 + Math.round((progress / 100) * 70);
                  emitProgress({
                    userId,
                    taskId,
                    type: "update",
                    step: `${file.name}: ${step}`,
                    progress: globalProgress,
                    done: false,
                  });
                },
              });

              const processTime = Date.now() - processStart;
              console.log(
                `✅ [PERF] Traitement PDF ${file.name} terminé en ${processTime}ms - Embeddings: ${result.embeddings?.length || 0}, Segments: ${result.segments?.length || 0}`,
              );

              // Sauvegarder les embeddings en base de données avec batch insert optimisé
              if (result.success && result.embeddings && result.segments) {
                emitProgress({
                  userId,
                  taskId,
                  type: "update",
                  step: `Sauvegarde des embeddings pour ${file.name}`,
                  progress: 90,
                  done: false,
                });

                // Validation des segments
                const validSegments = result.segments.filter(
                  (segment, index) => {
                    if (!segment || !segment.pageContent) {
                      console.warn(
                        `[${file.name}] Segment invalide à l'index ${index}`,
                      );
                      return false;
                    }
                    return true;
                  },
                );

                if (validSegments.length !== result.embeddings.length) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                      "Nombre de segments et d'embeddings ne correspond pas",
                  });
                }

                // Batch insert optimisé - Créer tous les documents d'un coup
                const batchInsertStart = Date.now();
                console.log(
                  `🚀 [PERF] Batch insert documents pour ${file.name}: ${validSegments.length} segments`,
                );

                await db.document.createMany({
                  data: validSegments.map((segment, i) => ({
                    name: file.name,
                    text: segment.pageContent,
                    modelId: input.modelId,
                    minioPath: `${model.bucketName}/${file.name}`,
                    mimeType: "application/pdf",
                    size: fileBuffer.length,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    segmentOrder: i,
                    pageNumber: segment.metadata?.pageNumber ?? 1,
                  })),
                });

                const batchInsertTime = Date.now() - batchInsertStart;
                console.log(
                  `✅ [PERF] Batch insert terminé en ${batchInsertTime}ms pour ${validSegments.length} documents`,
                );

                // Récupérer les IDs des documents créés
                const createdDocuments = await db.document.findMany({
                  where: {
                    modelId: input.modelId,
                    name: file.name,
                    minioPath: `${model.bucketName}/${file.name}`,
                  },
                  select: { id: true, segmentOrder: true },
                  orderBy: { segmentOrder: "asc" },
                });

                // Batch update des embeddings avec connexion optimisée
                const batchUpdateStart = Date.now();
                console.log(
                  `🚀 [PERF] Batch update embeddings pour ${file.name}: ${result.embeddings.length} embeddings`,
                );

                // Utilisation du service centralisé optimisé
                const batchUpdateResult =
                  await embeddingsService.processOptimizedBatchUpdate(
                    result.embeddings,
                    createdDocuments,
                    file.name,
                    5, // chunkSize ultra-réduit pour DB distante
                    2, // maxConcurrency réduit pour DB distante
                  );

                if (!batchUpdateResult.success) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Erreur lors de la sauvegarde des embeddings",
                  });
                }

                // Mise à jour de progression finale
                emitProgress({
                  userId,
                  taskId,
                  type: "update",
                  step: `Embeddings sauvegardés pour ${file.name} (${result.embeddings.length} segments)`,
                  progress: 95,
                  done: false,
                });

                const batchUpdateTime = Date.now() - batchUpdateStart;
                console.log(
                  `✅ [PERF] Batch update embeddings terminé en ${batchUpdateTime}ms pour ${result.embeddings.length} embeddings`,
                );
              }
            }
          }

          const totalFilesTime = Date.now() - totalFilesStart;
          console.log(
            `✅ [PERF] Traitement total ${input.files.length} fichier(s) terminé en ${totalFilesTime}ms`,
          );
        }

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: "Expert mis à jour avec succès",
          progress: 100,
          done: true,
        });

        return { success: true, modelId: input.modelId };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la mise à jour de l'expert";

        // Messages d'erreur clairs selon le type d'erreur
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("not found")
        ) {
          clearMessage = "Expert non trouvé ou accès non autorisé";
        } else if (
          errorMessage.includes("MinIO") ||
          errorMessage.includes("bucket")
        ) {
          clearMessage =
            "Erreur de connexion à MinIO - Impossible de traiter le document";
        } else if (
          errorMessage.includes("PDF") ||
          errorMessage.includes("fichier")
        ) {
          clearMessage = "Erreur lors du traitement du document PDF";
        } else if (errorMessage.includes("embedding")) {
          clearMessage = "Erreur lors de la création des embeddings";
        } else if (errorMessage.includes("Unique constraint")) {
          clearMessage = "Un expert avec ce nom existe déjà";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour modifier l'expert";
        } else if (
          errorMessage.includes("storage") ||
          errorMessage.includes("limite")
        ) {
          clearMessage = "Limite de stockage dépassée";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "STORE_EXPERT",
            modelId: 0,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        emitProgress({
          userId,
          taskId,
          type: "update",
          step: clearMessage,
          progress: 0,
          done: false,
          error: clearMessage,
        });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
          cause: error,
        });
      }
    }),

  // TODO: Suppression d'un expert avec nettoyage des fichiers MinIO et des données associées
  deleteAnExpert: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      try {
        // 1. Récupération du modèle et vérification en une seule requête
        const model = await db.models.findUnique({
          where: {
            id: input.modelId,
            isAnExpert: true,
            userId: session.user.id,
          },
          include: {
            documents: {
              select: {
                id: true,
                minioPath: true,
              },
            },
            messages: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!model) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Expert non trouvé ou accès non autorisé",
          });
        }

        if (!model.bucketName) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Le bucket MinIO n'existe pas pour cet expert",
          });
        }

        // 2. Vérification de la connexion MinIO avec retry
        const maxRetries = 3;
        let retryCount = 0;
        let isConnected = false;

        while (retryCount < maxRetries && !isConnected) {
          isConnected = await testMinioConnection();
          if (!isConnected) {
            await reconnectMinio();
            retryCount++;
            if (retryCount === maxRetries) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message:
                  "Impossible de se connecter à MinIO après plusieurs tentatives",
              });
            }
            await new Promise((resolve) =>
              setTimeout(resolve, 5000 * retryCount),
            );
          }
        }

        // 3. Suppression des fichiers MinIO avec gestion des erreurs
        try {
          const objectsList = [];
          for await (const obj of getMinio().listObjects(
            model.bucketName,
            "",
            true,
          )) {
            objectsList.push(obj.name);
          }

          if (objectsList.length > 0) {
            const batchSize = 100;
            const batches = [];

            for (let i = 0; i < objectsList.length; i += batchSize) {
              batches.push(objectsList.slice(i, i + batchSize));
            }

            // Suppression parallèle avec gestion des erreurs par batch
            await Promise.all(
              batches.map(async (batch) => {
                try {
                  await deleteMinioBatch(model.bucketName!, batch);
                } catch (error) {
                  console.error(
                    `Erreur lors de la suppression du batch: ${error}`,
                  );
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Erreur lors de la suppression des fichiers MinIO",
                  });
                }
              }),
            );
          }

          // Vérification que le bucket est bien vide
          const isEmpty = await isBucketEmpty(model.bucketName);
          if (!isEmpty) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Le bucket n'est pas vide après suppression",
            });
          }

          // Suppression du bucket avec timeout
          await Promise.race([
            getMinio().removeBucket(model.bucketName),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Timeout suppression bucket")),
                30000,
              ),
            ),
          ]);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de la suppression des fichiers MinIO",
            cause: error,
          });
        }

        // 4. Suppression des données en base dans une transaction
        return await db.$transaction(async (tx) => {
          try {
            // Création du log avant la suppression
            await db.userLogs.create({
              data: {
                userId: session.user.id,
                action: "DELETE",
                modelType: "EXPERT",
                modelId: input.modelId,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                email: session.user.email,
                description: "Suppression d'un model expert",
              },
            });

            // Suppression des documents
            if (model.documents.length > 0) {
              await tx.document.deleteMany({
                where: { modelId: input.modelId },
              });
            }

            // Suppression des messages
            if (model.messages.length > 0) {
              await tx.message.deleteMany({
                where: { modelId: input.modelId },
              });
            }

            // Suppression de l'expert
            await tx.models.delete({
              where: { id: input.modelId },
            });

            return {
              success: true,
              deletedDocuments: model.documents.length,
              deletedMessages: model.messages.length,
            };
          } catch (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erreur lors de la suppression des données",
              cause: error,
            });
          }
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la suppression de l'expert";

        // Messages d'erreur clairs selon le type d'erreur
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("not found")
        ) {
          clearMessage = "Expert non trouvé ou accès non autorisé";
        } else if (
          errorMessage.includes("MinIO") ||
          errorMessage.includes("bucket")
        ) {
          clearMessage =
            "Erreur de connexion à MinIO - Impossible de supprimer les fichiers";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour supprimer l'expert";
        } else if (
          errorMessage.includes("foreign key") ||
          errorMessage.includes("constraint")
        ) {
          clearMessage =
            "Impossible de supprimer l'expert - des données sont encore utilisées";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "EXPERT",
            modelId: input.modelId,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
          cause: error,
        });
      }
    }),
  // TODO: Suppression d'un agent avec nettoyage des fichiers MinIO et des données associées
  deleteAnAgent: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      try {
        // 1. Récupération du modèle et vérification en une seule requête
        const model = await db.models.findUnique({
          where: {
            id: input.modelId,
            userId: session.user.id,
            isAnExpert: false,
          },
          include: {
            messages: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!model) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent non trouvé ou accès non autorisé",
          });
        }

        // 2. Suppression dans une transaction
        return await db.$transaction(async (tx) => {
          try {
            // Création du log avant la suppression
            await db.userLogs.create({
              data: {
                userId: session.user.id,
                action: "DELETE",
                modelType: "AGENT",
                modelId: input.modelId,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                email: session.user.email,
                description: "Suppression d'un model agent",
              },
            });

            // Suppression des messages si nécessaire
            if (model.messages.length > 0) {
              await tx.message.deleteMany({
                where: { modelId: input.modelId },
              });
            }

            // Suppression de l'agent
            await tx.models.delete({
              where: { id: input.modelId },
            });

            return {
              success: true,
              deletedMessages: model.messages.length,
            };
          } catch (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erreur lors de la suppression des données",
              cause: error,
            });
          }
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la suppression de l'agent";

        // Messages d'erreur clairs selon le type d'erreur
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("not found")
        ) {
          clearMessage = "Agent non trouvé ou accès non autorisé";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion à la base de données";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour supprimer l'agent";
        } else if (
          errorMessage.includes("foreign key") ||
          errorMessage.includes("constraint")
        ) {
          clearMessage =
            "Impossible de supprimer l'agent - des données sont encore utilisées";
        }

        // Log de l'erreur
        await db.userLogs.create({
          data: {
            userId: session.user.id,
            action: "WARNING",
            modelType: "AGENT",
            modelId: input.modelId,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            description: clearMessage,
          },
        });

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
          cause: error,
        });
      }
    }),

  // Récupérer les modèles de l'utilisateur
  getModels: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    try {
      const models = await db.models.findMany({
        where: {
          userId: session.user.id,
          isTemplate: false, // Exclure les modèles store
        },
        select: {
          id: true,
          name: true,
          prompt: true,
          modelName: true,
          provider: true,
          bucketName: true,
          isAnExpert: true,
          isTemplate: true,
          documents: {
            select: {
              id: true,
              name: true,
              minioPath: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },
          },
          modelNameRelation: {
            select: {
              maxInputTokens: true,
              useOnlyHumanMessage: true,
            },
          },
        },
      });
      return models;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des modèles.",
      });
    }
  }),

  // Récupérer un modèle par ID
  getModelById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx: { db, session }, input }) => {
      // Vérifier d'abord si c'est un modèle store
      const storeModel = await db.models.findFirst({
        where: {
          id: input.id,
          isTemplate: true,
        },
        include: {
          modelNameRelation: true,
          providerRelation: true,
        },
      });

      if (storeModel) {
        // C'est un modèle store - vérifier les permissions
        // Vérifier si l'utilisateur a accès via StoreAccess
        const storeAccess = await db.storeAccess.findFirst({
          where: {
            userId: session.user.id,
            modelId: input.id,
            // Vérifier que l'accès n'est pas expiré
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

        if (!storeAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous devez souscrire à ce modèle pour y accéder",
          });
        }

        return storeModel;
      }

      // Modèle personnel - vérifier la propriété
      const personalModel = await db.models.findFirst({
        where: {
          id: input.id,
          userId: session.user.id,
          isTemplate: false, // S'assurer que ce n'est pas un modèle store
        },
        include: {
          modelNameRelation: true,
          providerRelation: true,
        },
      });

      if (!personalModel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modèle non trouvé ou accès non autorisé",
        });
      }

      return personalModel;
    }),
});
