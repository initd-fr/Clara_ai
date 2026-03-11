/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { emitProgress } from "~/server/shared/progressBridge";
import type { Session } from "next-auth";
import { getMinio, testMinioConnection, reconnectMinio } from "~/server/db";
import { processFileAfterUpload } from "~/server/api/routers/Files/buckets";
import { AccessControlService } from "~/server/services/accessControl";
// PgRawPool n'est plus utilisé directement, remplacé par embeddingsService
import { embeddingsService } from "~/server/api/routers/chat/ModelsPerso/Services/embeddings";
/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface createAnAgentProps {
  name: string;
  prompt: string;
  modelName: string;
  isAnExpert: boolean;
  provider: string;
  userId: string;
  skipTaskCreation?: boolean;
}

interface createAnExpertProps extends createAnAgentProps {
  files: Array<{
    name: string;
    content: string;
    size: number;
  }>;
  skipTaskCreation?: boolean;
}

interface ProcessedFile {
  name: string;
  embeddings: number[][];
  segments: { pageContent: string; metadata?: { pageNumber?: number } }[];
}
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

export default async function createAnAgent(
  props: createAnAgentProps,
  ctx: { db: PrismaClient; session: Session },
) {
  const userId = ctx.session.user.id;
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

  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Vérification des permissions",
    progress: 10,
    done: false,
  });

  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Création du modèle en base",
    progress: 50,
    done: false,
  });

  try {
    emitProgress({
      userId,
      taskId,
      type: "create",
      step: "Création du modèle en base",
      progress: 60,
      done: false,
    });

    const newModel = await ctx.db.models.create({
      data: {
        name: props.name,
        prompt: props.prompt,
        modelName: props.modelName,
        provider: props.provider,
        isAnExpert: props.isAnExpert,
        userId: userId,
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

    await ctx.db.userLogs.create({
      data: {
        userId: ctx.session.user.id,
        action: "CREATE",
        modelType: "AGENT",
        modelId: newModel.id,
        firstName: ctx.session.user.firstName,
        lastName: ctx.session.user.lastName,
        email: ctx.session.user.email,
        description: "Création d'un model agent par l'ia",
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

    return { ...newModel };
  } catch (error) {
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

    emitProgress({
      userId,
      taskId,
      type: "create",
      step: clearMessage,
      progress: 0,
      done: false,
      error: clearMessage,
    });

    // Log de l'erreur
    await ctx.db.userLogs.create({
      data: {
        userId: ctx.session.user.id,
        action: "WARNING",
        modelType: "AGENT",
        modelId: 0,
        firstName: ctx.session.user.firstName,
        lastName: ctx.session.user.lastName,
        email: ctx.session.user.email,
        description: clearMessage,
      },
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: clearMessage,
    });
  }
}

export async function createAnExpert(
  input: createAnExpertProps,
  ctx: { db: PrismaClient; session: Session },
) {
  const userId = input.userId;
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

  if (!input.isAnExpert) {
    emitProgress({
      userId,
      taskId,
      type: "create",
      step: "Erreur: Le modèle doit être un expert",
      progress: 0,
      done: false,
      error: "Le modèle doit être un expert",
    });
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Le modèle doit être un expert.",
    });
  }

  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Vérification des permissions",
    progress: 5,
    done: false,
  });

  // App locale : pas de vérification de config, tout le monde peut créer
  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Vérification des limites de stockage",
    progress: 10,
    done: false,
  });

  const storageLimit = await AccessControlService.getStorageLimit(userId);
  if (storageLimit !== null) {
    const totalSize = input.files.reduce((acc, file) => acc + file.size, 0);
    const totalSizeInGB = totalSize / (1024 * 1024 * 1024);

    const userModels = await ctx.db.models.findMany({
      where: { userId },
      select: { bucketName: true },
    });

    let currentStorageSize = 0;
    for (const model of userModels) {
      if (!model.bucketName) continue;
      const objectsList = getMinio().listObjects(model.bucketName, "", true);
      for await (const file of objectsList) {
        currentStorageSize += file.size;
      }
    }
    const currentStorageSizeInGB = currentStorageSize / (1024 * 1024 * 1024);

    if (currentStorageSizeInGB + totalSizeInGB > storageLimit) {
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Erreur: Limite de stockage dépassée",
        progress: 0,
        done: false,
        error: `Limite de stockage dépassée. Vous avez ${storageLimit}GB de stockage disponible.`,
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Limite de stockage dépassée. Vous avez ${storageLimit}GB de stockage disponible.`,
      });
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

  const bucketName = `model-${userId}-${Date.now()}`;

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
      await new Promise((resolve) => setTimeout(resolve, 5000 * retryCount));
    }
  }

  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Création du bucket MinIO",
    progress: 20,
    done: false,
  });

  try {
    const bucketExists = await getMinio().bucketExists(bucketName);
    if (!bucketExists) {
      await getMinio().makeBucket(bucketName);
    }
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

  const processedFiles: ProcessedFile[] = [];
  let newModel: { id: number } | undefined;

  const cleanup = async () => {
    try {
      const objectsList = [];
      for await (const obj of getMinio().listObjects(bucketName, "", true)) {
        objectsList.push(obj.name);
      }
      if (objectsList.length > 0) {
        await getMinio().removeObjects(bucketName, objectsList);
      }
      await getMinio().removeBucket(bucketName);

      if (newModel?.id) {
        await ctx.db.models.delete({
          where: { id: newModel.id },
        });
      }

      if (newModel?.id) {
        await ctx.db.document.deleteMany({
          where: { modelId: newModel.id },
        });
      }
    } catch (cleanupError) {
      console.error("Erreur lors du nettoyage:", cleanupError);
    }
  };

  emitProgress({
    userId,
    taskId,
    type: "create",
    step: "Création du modèle en base",
    progress: 25,
    done: false,
  });

  try {
    newModel = await ctx.db.models.create({
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

    if (!newModel) {
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Erreur: Création du modèle échouée",
        progress: 0,
        done: false,
        error: "Erreur lors de la création du modèle",
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la création du modèle",
      });
    }

    emitProgress({
      userId,
      taskId,
      type: "create",
      step: `Traitement de ${input.files.length} fichier(s)`,
      progress: 30,
      done: false,
    });

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if (!file?.content || !file?.name) {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: `Erreur: Fichier invalide à l'index ${i}`,
          progress: 0,
          done: false,
          error: `Fichier invalide à l'index ${i}`,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Fichier invalide à l'index ${i}`,
        });
      }

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        emitProgress({
          userId,
          taskId,
          type: "create",
          step: `Erreur: Le fichier ${file.name} n'est pas un PDF`,
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
          step: `Erreur: Traitement du fichier ${file.name} échoué`,
          progress: 0,
          done: false,
          error: "Erreur lors du traitement du fichier",
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du traitement du fichier",
        });
      }
    }

    if (!newModel?.id) {
      emitProgress({
        userId,
        taskId,
        type: "create",
        step: "Erreur: ID du modèle non défini",
        progress: 0,
        done: false,
        error: "ID du modèle non défini",
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ID du modèle non défini",
      });
    }

    emitProgress({
      userId,
      taskId,
      type: "create",
      step: "Enregistrement des logs",
      progress: 90,
      done: false,
    });

    const modelId = newModel.id;
    const totalEmbeddings = processedFiles.reduce(
      (acc, file) => acc + file.embeddings.length,
      0,
    );
    let processedEmbeddings = 0;

    emitProgress({
      userId,
      taskId,
      type: "create",
      step: "Sauvegarde des embeddings en base",
      progress: 90,
      done: false,
    });

    // Traitement optimisé par fichier avec batch inserts
    for (const file of processedFiles) {
      // Validation des segments
      const validSegments = file.segments.filter((segment, index) => {
        if (!segment || !segment.pageContent) {
          console.warn(`[${file.name}] Segment invalide à l'index ${index}`);
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

      await ctx.db.document.createMany({
        data: validSegments.map((segment, i) => ({
          name: file.name,
          text: segment.pageContent,
          modelId: modelId,
          minioPath: `${bucketName}/${file.name}`,
          mimeType: "application/pdf",
          size: 0,
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
      const createdDocuments = await ctx.db.document.findMany({
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
    }

    await ctx.db.userLogs.create({
      data: {
        userId: ctx.session.user.id,
        action: "CREATE",
        modelType: "EXPERT",
        modelId: newModel.id,
        firstName: ctx.session.user.firstName,
        lastName: ctx.session.user.lastName,
        email: ctx.session.user.email,
        description: "Création d'un model expert par l'ia",
      },
    });

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

    emitProgress({
      userId,
      taskId,
      type: "create",
      step: clearMessage,
      progress: 0,
      done: false,
      error: clearMessage,
    });

    // Log de l'erreur
    await ctx.db.userLogs.create({
      data: {
        userId: ctx.session.user.id,
        action: "WARNING",
        modelType: "EXPERT",
        modelId: 0,
        firstName: ctx.session.user.firstName,
        lastName: ctx.session.user.lastName,
        email: ctx.session.user.email,
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
}
//////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////
