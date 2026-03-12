/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import PDFParser from "pdf2json";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { testMinioConnection, reconnectMinio, getMinio } from "~/server/db";
import {
  embeddingsService,
  type BatchResult,
} from "~/server/api/routers/chat/ModelsPerso/Services/embeddings";
import { emitProgress } from "~/server/shared/progressBridge";
import { settingsManager } from "~/server/api/routers/Settings/settingsManager";
import { log, LogLevel } from "~/globalUtils/debug";
import axios from "axios";
/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
interface ProcessFileResult {
  success: boolean;
  embeddings: number[][];
  segments: Array<{
    pageContent: string;
    metadata?: {
      pageNumber?: number;
    };
  }>;
}

interface MistralOCRPage {
  index: number;
  markdown: string;
}

export const normalizeExcessiveLineBreaks = (text: string): string => {
  return (
    text
      // Remplacer tous les types de retours à la ligne par "\n"
      .replace(/\r\n|\r|\n/g, "\n")
      // Supprimer les lignes entièrement vides (ne contenant que des espaces ou retours à la ligne)
      .replace(/^\s*$/gm, "")
      // Supprimer les espaces inutiles à la fin des lignes
      .replace(/[\t ]+$/gm, "")
      // Supprimer les espaces multiples dans une ligne
      .replace(/[ \t]+/g, " ")
      // Supprimer les retours multiples consécutifs (laisser un seul)
      .replace(/(\n){2,}/g, "\n")
      // Supprime les caractères non imprimables (hors ASCII standard).
      .replace(/[^\x20-\x7E]/g, "")
      // Supprimer les retours ou espaces inutiles au début et à la fin du texte
      .trim()
  );
};

export const bucketsRouter = createTRPCRouter({
  // & Obtenir les fichiers d'un modèle spécifique
  getFilesByModelId: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .query(async ({ ctx: { db, session }, input: { modelId } }) => {
      const userId = session.user.id;

      // Vérifier la connexion MinIO
      const isConnected = await testMinioConnection();
      if (!isConnected) {
        await reconnectMinio();
      }

      try {
        // Vérifier que le modèle existe — accès aux modèles personnels et store (app locale : tout le monde)
        const model = await db.models.findUnique({
          where: {
            id: modelId,
            OR: [{ userId: userId }, { isTemplate: true, userId: null }],
          },
          select: { bucketName: true },
        });

        if (!model?.bucketName) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modèle non trouvé ou bucket non défini.",
          });
        }

        // Récupérer la liste des fichiers
        const objectsList = getMinio().listObjects(model.bucketName, "", true);
        const files = [];

        // Parcourir le stream des objets
        for await (const file of objectsList) {
          files.push({
            name: file.name,
            size: file.size,
          });
        }

        return files;
      } catch (error) {
        console.error("Erreur lors de la récupération des fichiers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des fichiers.",
        });
      }
    }),
  // & Uploader un fichier pour un modèle spécifique et stocker les embeddings
  uploadFileOpenai: protectedProcedure
    .input(
      z.object({
        modelId: z.number(),
        name: z.string(),
        file: z.string(),
        size: z.number(),
        totalStorageSizeData: z.number(),
        totalLimitStorage: z.number(),
      }),
    )
    .mutation(async ({ input, ctx: { session, db } }) => {
      const { modelId, name, file } = input;
      const userId = session.user.id;

      // Étape 1: Vérification du modèle
      log(LogLevel.DEBUG, `Checking model`);
      let model;
      try {
        model = await db.models.findUnique({
          where: { id: modelId, userId },
          select: { bucketName: true },
        });
        if (!model?.bucketName) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modèle non trouvé",
          });
        }
      } catch (error) {
        console.error("Erreur de vérification du modèle:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Erreur lors de la vérification du modèle",
          cause: error,
        });
      }

      // Étape 2: Téléchargement
      log(LogLevel.DEBUG, `Download`);
      let pdfBuffer;
      try {
        const res = await fetch(file);
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const blob = await res.blob();
        pdfBuffer = Buffer.from(await blob.arrayBuffer());
      } catch (error) {
        console.error("Erreur de téléchargement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du téléchargement du fichier",
          cause: error,
        });
      }

      const result = await processFileAfterUpload({
        name,
        pdfBuffer,
        modelId,
        modelBucketName: model.bucketName,
        userId,
      });

      return result;
    }),
  // & Supprimer un fichier
  deleteFile: protectedProcedure
    .input(z.object({ name: z.string(), modelId: z.number() }))
    .mutation(async ({ ctx: { db, session }, input: { name, modelId } }) => {
      try {
        const userId = session.user.id;
        const taskId = `update-${Date.now()}`;

        // Événement de début de suppression
        emitProgress({
          userId,
          taskId,
          type: "update",
          step: `Suppression du document ${name}`,
          progress: 0,
          done: false,
        });

        // Vérifier la connexion MinIO
        const isConnected = await testMinioConnection();
        if (!isConnected) {
          await reconnectMinio();
        }

        // Récupérer le modèle pour vérifier les permissions (app locale : tout le monde)
        const model = await db.models.findUnique({
          where: {
            id: modelId,
            OR: [{ userId: userId }, { isTemplate: true, userId: null }],
          },
          select: { bucketName: true },
        });

        if (!model?.bucketName) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modèle non trouvé.",
          });
        }

        // Supprimer le fichier du bucket MinIO
        await getMinio().removeObject(model.bucketName, name);

        // Événement de progression après suppression MinIO
        emitProgress({
          userId,
          taskId,
          type: "update",
          step: `Fichier ${name} supprimé de MinIO`,
          progress: 50,
          done: false,
        });

        // Supprimer les segments correspondants dans la base de données
        await db.document.deleteMany({
          where: {
            name: name,
            modelId: modelId,
          },
        });

        // Événement de fin de suppression
        emitProgress({
          userId,
          taskId,
          type: "update",
          step: `Embeddings supprimés pour ${name}`,
          progress: 100,
          done: true,
        });

        return {
          message: "Le fichier et ses embeddings ont bien été supprimés.",
        };
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);

        // Événement d'erreur
        try {
          const errorUserId = session.user.id;
          emitProgress({
            userId: errorUserId,
            taskId: `update-${Date.now()}`,
            type: "update",
            step: "Erreur lors de la suppression du document",
            progress: 0,
            done: false,
            error: (error as Error).message,
          });
        } catch {}

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du fichier.",
        });
      }
    }),

  // & Télécharger le contenu d'un fichier
  getFileContent: protectedProcedure
    .input(z.object({ filename: z.string(), modelId: z.number() }))
    .mutation(
      async ({ ctx: { db, session }, input: { filename, modelId } }) => {
        try {
          const userId = session.user.id;

          // Vérifier la connexion MinIO
          const isConnected = await testMinioConnection();
          if (!isConnected) {
            await reconnectMinio();
          }

          // Récupérer le modèle pour vérifier les permissions (app locale : tout le monde)
          const model = await db.models.findUnique({
            where: {
              id: modelId,
              OR: [{ userId: userId }, { isTemplate: true, userId: null }],
            },
            select: { bucketName: true },
          });

          if (!model?.bucketName) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Modèle non trouvé.",
            });
          }

          // Récupérer le fichier de MinIO
          const dataStream = await getMinio().getObject(
            model.bucketName,
            filename,
          );

          // Convertir le stream en buffer
          const chunks: Uint8Array[] = [];
          for await (const chunk of dataStream) {
            chunks.push(new Uint8Array(chunk));
          }
          const fileBuffer = Buffer.concat(chunks);

          // Création du log
          await db.userLogs.create({
            data: {
              userId: userId,
              action: "GET_FILE_CONTENT",
              modelId: modelId,
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              email: session.user.email,
              description: `Récupération du contenu d'un fichier: ${filename} pour le modèle: ${modelId}`,
            },
          });
          return {
            name: filename,
            pdf: fileBuffer.toString("base64"),
          };
        } catch (error) {
          // Création du log
          await db.userLogs.create({
            data: {
              userId: session.user.id,
              action: "ERROR",
              modelId: modelId,
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              email: session.user.email,
              description:
                `Erreur lors de la récupération du contenu du fichier: ${filename} pour le modèle: ${modelId}` +
                error,
            },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de la récupération du contenu du fichier.",
          });
        }
      },
    ),
  //  & Récupérer la taille totale de tous les fichiers dans les buckets d'un utilisateur
  getTotalStorageSize: protectedProcedure.query(
    async ({ ctx: { db, session } }) => {
      const userId = session.user.id;
      log(LogLevel.DEBUG, `Calcul du stockage pour l'utilisateur:${userId}`);

      const isConnected = await testMinioConnection();
      if (!isConnected) {
        await reconnectMinio();
      }

      try {
        const userModels = await db.models.findMany({
          where: { userId },
          select: { bucketName: true, id: true },
        });

        log(LogLevel.DEBUG, `Modèles trouvés:${userModels}`);

        let totalSize = 0;

        for (const model of userModels) {
          if (!model.bucketName) continue;

          try {
            const objectsList = getMinio().listObjects(
              model.bucketName,
              "",
              true,
            );

            for await (const file of objectsList) {
              totalSize += file.size;
            }
          } catch (error) {
            console.error(
              `⚠️ Erreur pour le bucket ${model.bucketName}:`,
              error,
            );
          }
        }

        const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

        return { totalSizeInMB: parseFloat(totalSizeInMB) };
      } catch (error) {
        console.error("Erreur globale:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Erreur lors de la récupération de la taille totale de stockage.",
        });
      }
    },
  ),
});

// Constantes de configuration optimisées selon l'environnement
const EMBEDDING_BATCH_SIZE = 10;
const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 100;

// Fonction helper pour timeout
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

// & Process uploaded file
export async function processFileAfterUpload({
  name,
  pdfBuffer,
  modelId,
  modelBucketName,
  userId: _userId,
  onProgress,
}: {
  name: string;
  pdfBuffer: Buffer;
  modelId: number;
  modelBucketName: string;
  userId: string;
  onProgress?: (progress: number, step: string) => void;
}): Promise<ProcessFileResult> {
  // Étape 3: Extraction du texte
  log(LogLevel.DEBUG, `[${name}] Début de l'extraction du texte du PDF`);
  let text;
  try {
    const pdfParser = new PDFParser(null, true);
    text = await withTimeout(
      new Promise<string>((resolve, reject) => {
        pdfParser.once("pdfParser_dataError", (err) => {
          console.error(`[${name}] Erreur PDF Parser:`, err);
          reject(new Error("Erreur d'extraction du texte"));
        });
        pdfParser.once("pdfParser_dataReady", () => {
          log(LogLevel.DEBUG, `[${name}] Extraction du texte terminée`);
          const extractedText = pdfParser.getRawTextContent().trim();
          if (extractedText && extractedText.length > 0) {
            resolve(extractedText);
          } else {
            reject(new Error("Aucun texte extrait"));
          }
        });
        pdfParser.parseBuffer(pdfBuffer);
      }),
      Number(await settingsManager.get("pdfParser_timeout")),
      "L'extraction du texte prend trop de temps",
    );
    log(
      LogLevel.DEBUG,
      `[${name}] Taille du texte extrait: ${text.length} caractères`,
    );
    onProgress?.(30, "Extraction du texte terminée");
  } catch (pdfError) {
    log(LogLevel.DEBUG, `[${name}] Échec de l'extraction PDF: ${pdfError}`);

    // Fallback avec Mistral OCR
    try {
      if (!process.env.MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY non configurée");
      }

      // Utiliser le même format que côté utilisateur
      const base64String = pdfBuffer.toString("base64");
      const documentUrl = `data:application/pdf;base64,${base64String}`;

      const response = await axios.post(
        "https://api.mistral.ai/v1/ocr",
        {
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            document_url: documentUrl,
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

      log(
        LogLevel.DEBUG,
        `[${name}] OCR Mistral réussi - Taille du texte: ${text.length} caractères`,
      );
      onProgress?.(30, "OCR Mistral terminé");
    } catch (ocrError) {
      log(LogLevel.DEBUG, `[${name}] Échec de l'OCR Mistral: ${ocrError}`);
      onProgress?.(0, "Échec de l'extraction du texte");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Impossible d'extraire le texte du PDF (parsing et OCR ont échoué)",
        cause: pdfError,
      });
    }
  }

  // Étape 4: Segmentation
  log(LogLevel.DEBUG, `[${name}] Début de la segmentation du texte`);
  let segments;
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    });

    // Vérification et nettoyage du texte avant segmentation
    const cleanText = text ? text.replace(/[\r\n]/g, "").trim() : "";
    if (!cleanText) {
      throw new Error("Le texte extrait est vide");
    }

    segments = await textSplitter.splitDocuments([
      {
        pageContent: cleanText,
        metadata: { source: name },
      },
    ]);

    if (!segments || segments.length === 0) {
      throw new Error("Aucun segment n'a été créé");
    }

    log(
      LogLevel.DEBUG,
      `[${name}] Segmentation terminée: ${segments.length} segments créés`,
    );
    onProgress?.(
      40,
      `Segmentation terminée: ${segments.length} segments créés`,
    );
  } catch (error) {
    onProgress?.(0, "Erreur de segmentation");
    console.error(`[${name}] Erreur de segmentation:`, error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erreur lors de la segmentation du texte",
      cause: error,
    });
  }

  // Étape 5: Création des embeddings (optimisée)
  log(
    LogLevel.DEBUG,
    `[${name}] Début de la création des embeddings pour ${segments.length} segments`,
  );
  const processedEmbeddings = [];
  try {
    const BATCH_SIZE = Math.min(
      EMBEDDING_BATCH_SIZE,
      Math.max(5, Math.floor(segments.length / 10)),
    );

    log(
      LogLevel.DEBUG,
      `[${name}] Taille des lots: ${BATCH_SIZE} segments par lot`,
    );

    // Préparer tous les batches
    const batches: any[][] = [];
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments
        .slice(i, i + BATCH_SIZE)
        .filter(
          (segment) =>
            segment &&
            segment.pageContent &&
            typeof segment.pageContent === "string",
        );

      if (batch.length > 0) {
        batches.push(batch);
      }
    }

    const totalBatches = batches.length;
    log(
      LogLevel.DEBUG,
      `[${name}] ${totalBatches} batches préparés pour traitement parallèle`,
    );

    // Traitement parallèle des batches (max 3 en parallèle pour éviter la surcharge)
    const maxConcurrency = 3;
    const pdfBufferSize = pdfBuffer.length;
    const segmentsCount = segments.length;

    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const batchGroup = batches.slice(i, i + maxConcurrency);
      const currentGroup = Math.floor(i / maxConcurrency) + 1;
      const totalGroups = Math.ceil(batches.length / maxConcurrency);

      // Calcul de la progression pour les embeddings (40% à 90%)
      const progress = 40 + Math.round((i / batches.length) * 50);
      onProgress?.(
        progress,
        `Traitement parallèle du groupe ${currentGroup}/${totalGroups}`,
      );

      // Traitement parallèle du groupe de batches
      const batchPromises = batchGroup.map((batch, groupIndex) =>
        embeddingsService.processEmbeddingBatch(
          batch,
          (i + groupIndex) * BATCH_SIZE,
          segmentsCount,
          {
            name,
            modelId: modelId,
            pdfBufferSize,
          },
        ),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Vérification des résultats
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result && result.status === "rejected") {
          onProgress?.(0, "Erreur lors du traitement des embeddings");
          throw new Error(
            `[${name}] Erreur batch ${i + j}: ${(result as PromiseRejectedResult).reason}`,
          );
        } else if (
          result &&
          result.status === "fulfilled" &&
          !(result as PromiseFulfilledResult<BatchResult>).value.success
        ) {
          onProgress?.(0, "Erreur lors du traitement des embeddings");
          throw new Error(
            `[${name}] Erreur batch ${i + j}: ${JSON.stringify((result as PromiseFulfilledResult<BatchResult>).value)}`,
          );
        }
      }

      // Récupération des embeddings traités pour ce groupe
      const groupEmbeddings = await Promise.all(
        batchGroup
          .flat()
          .map((item) => embeddingsService.getEmbedding(item.pageContent)),
      );
      processedEmbeddings.push(...groupEmbeddings);

      log(
        LogLevel.DEBUG,
        `[${name}] Groupe ${currentGroup}/${totalGroups} traité avec succès`,
      );
    }

    log(LogLevel.DEBUG, `[${name}] Création des embeddings terminée`);
    onProgress?.(90, "Création des embeddings terminée");
  } catch (error) {
    onProgress?.(0, "Erreur de création des embeddings");
    console.error(`[${name}] Erreur de création des embeddings:`, error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erreur lors de la création des embeddings",
      cause: error,
    });
  }

  // Étape 6: Upload Minio
  log(LogLevel.DEBUG, `[${name}] Début de l'upload vers MinIO`);
  try {
    log(
      LogLevel.DEBUG,
      `[${name}] Upload vers MinIO - bucket: ${modelBucketName}, fichier: ${name}`,
    );

    await Promise.race([
      getMinio().putObject(modelBucketName, name, pdfBuffer, pdfBuffer.length, {
        "Content-Type": "application/pdf",
      }),
      new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Timeout upload fichier")), 600000), // 10 minutes
      ),
    ]);
    log(LogLevel.DEBUG, `[${name}] Upload vers MinIO terminé avec succès`);
    onProgress?.(95, "Upload vers MinIO terminé");
  } catch (error) {
    console.error(`[${name}] Erreur de stockage Minio:`, error);
    onProgress?.(0, "Erreur de stockage MinIO");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erreur lors du stockage du fichier",
      cause: error,
    });
  }

  // Finalisation
  log(LogLevel.DEBUG, `[${name}] Traitement terminé avec succès`);
  onProgress?.(100, "Traitement terminé avec succès");

  // Nettoyage du cache après traitement complet
  try {
    await embeddingsService.clearCache();
    await embeddingsService.cleanupDBCache();
    log(LogLevel.DEBUG, `[${name}] Cache nettoyé avec succès`);
  } catch (error) {
    log(
      LogLevel.DEBUG,
      `[${name}] Erreur lors du nettoyage du cache: ${error}`,
    );
  }

  return {
    success: true,
    embeddings: processedEmbeddings,
    segments: segments,
  } as ProcessFileResult;
}
