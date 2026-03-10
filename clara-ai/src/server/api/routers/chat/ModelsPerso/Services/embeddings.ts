import { OpenAIEmbeddings } from "@langchain/openai";
import { PgRawPool } from "~/globalUtils/PgRawPool";
import { log, LogLevel } from "~/globalUtils/debug";
import crypto from "crypto";

export type BatchResult =
  | { success: true; processed: number }
  | { success: false; error: any; index?: number };

interface BatchOptions {
  name: string;
  modelId?: number;
  pdfBufferSize: number;
}

class EmbeddingsService {
  private static instance: EmbeddingsService;
  private cache: Map<string, { embedding: number[]; timestamp: number }> =
    new Map();
  private embeddings: OpenAIEmbeddings;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

  private constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: process.env.EMBEDDINGS_MODEL ?? "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
      maxConcurrency: 5,
      maxRetries: 3,
    });
  }

  public static getInstance(): EmbeddingsService {
    if (!EmbeddingsService.instance) {
      EmbeddingsService.instance = new EmbeddingsService();
    }
    return EmbeddingsService.instance;
  }

  public async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.generateCacheKey(text);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      log(LogLevel.DEBUG, "Using cached embedding");
      return cached.embedding;
    }

    // Vérifier le cache en base de données
    try {
      const dbCached = await this.getEmbeddingFromDBCache(text);
      if (dbCached) {
        log(LogLevel.DEBUG, "Using DB cached embedding");
        this.cache.set(cacheKey, {
          embedding: dbCached,
          timestamp: Date.now(),
        });
        return dbCached;
      }
    } catch (error) {
      log(LogLevel.DEBUG, `DB cache lookup failed: ${error}`);
    }

    try {
      const result = await this.embeddings.embedQuery(text);
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error("Failed to generate embedding: invalid result");
      }

      // Mise à jour des caches
      this.cache.set(cacheKey, { embedding: result, timestamp: Date.now() });
      await this.saveEmbeddingToDBCache(text, result);

      return result;
    } catch (error) {
      log(
        LogLevel.ERROR,
        `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  public async processBatch(
    batch: any[],
    startIndex: number,
    segmentsCount: number,
    options: BatchOptions,
  ): Promise<BatchResult> {
    try {
      const client = await PgRawPool.connect();
      const processed = await this.embeddings.embedDocuments(
        batch.map((item) => item.text),
      );

      // Optimisation: Batch INSERT au lieu de boucles individuelles
      const values: string[] = [];
      const params: any[] = [];

      const now = new Date();
      for (let i = 0; i < processed.length; i++) {
        const item = batch[i];
        const embedding = processed[i];
        if (!Array.isArray(embedding)) {
          throw new Error(`Invalid embedding at index ${i}`);
        }

        // Mise à jour du cache en mémoire
        const cacheKey = this.generateCacheKey(item.text);
        this.cache.set(cacheKey, { embedding, timestamp: Date.now() });

        // Construction des valeurs pour le batch INSERT (aligné sur le schéma Document)
        const paramStartIndex = params.length + 1;
        values.push(
          `($${paramStartIndex}, $${paramStartIndex + 1}, $${paramStartIndex + 2}, $${paramStartIndex + 3}, $${paramStartIndex + 4}, $${paramStartIndex + 5}::vector, $${paramStartIndex + 6}, $${paramStartIndex + 7}, $${paramStartIndex + 8}, $${paramStartIndex + 9}, $${paramStartIndex + 10}, $${paramStartIndex + 11}, $${paramStartIndex + 12})`,
        );

        params.push(
          item.text,
          options.name,
          startIndex + i,
          item.pageNumber ?? 1,
          options.modelId,
          `[${embedding.join(",")}]`,
          options.name,
          "application/pdf",
          options.pdfBufferSize,
          now,
          now,
        );
      }

      // Exécution du batch INSERT unique
      if (values.length > 0) {
        await client.query(
          `INSERT INTO "Document" (
            "text", "name", "segmentOrder", "pageNumber", 
            "modelId", "embedding", "minioPath", "mimeType", "size",
            "createdAt", "updatedAt"
          ) VALUES ${values.join(", ")}`,
          params,
        );
      }

      client.release();
      return { success: true, processed: processed.length };
    } catch (error) {
      log(LogLevel.ERROR, `Batch processing failed: ${error}`);
      return { success: false, error };
    }
  }

  public async processEmbeddingBatch(
    batch: any[],
    startIndex: number,
    segmentsCount: number,
    options: BatchOptions,
  ): Promise<BatchResult> {
    try {
      const client = await PgRawPool.connect();
      const processed = await this.embeddings.embedDocuments(
        batch.map((item) => item.pageContent),
      );

      const now = new Date();

      // Optimisation: Batch INSERT au lieu de boucles individuelles
      const values: string[] = [];
      const params: any[] = [];

      for (let i = 0; i < processed.length; i++) {
        const item = batch[i];
        const embedding = processed[i];
        if (!Array.isArray(embedding)) {
          throw new Error(`Invalid embedding at index ${i}`);
        }

        // Mise à jour du cache en mémoire
        const cacheKey = this.generateCacheKey(item.pageContent);
        this.cache.set(cacheKey, { embedding, timestamp: Date.now() });

        // Construction des valeurs pour le batch INSERT
        const paramStartIndex = params.length + 1;
        values.push(
          `($${paramStartIndex}, $${paramStartIndex + 1}, $${paramStartIndex + 2}, $${paramStartIndex + 3}, $${paramStartIndex + 4}, $${paramStartIndex + 5}::vector, $${paramStartIndex + 6}, $${paramStartIndex + 7}, $${paramStartIndex + 8}, $${paramStartIndex + 9}, $${paramStartIndex + 10})`,
        );

        params.push(
          item.pageContent,
          options.name,
          startIndex + i,
          item.metadata?.pageNumber ?? 1,
          options.modelId,
          `[${embedding.join(",")}]`,
          `${options.name}/${startIndex + i}`,
          "text/plain",
          Buffer.from(item.pageContent).length,
          now,
          now,
        );
      }

      // Exécution du batch INSERT unique
      if (values.length > 0) {
        await client.query(
          `INSERT INTO "Document" (
            "text", "name", "segmentOrder", "pageNumber", 
            "modelId", "embedding", "minioPath", "mimeType", "size",
            "createdAt", "updatedAt"
          ) VALUES ${values.join(", ")}`,
          params,
        );
      }

      client.release();
      return { success: true, processed: processed.length };
    } catch (error) {
      log(LogLevel.ERROR, `Batch processing failed: ${error}`);
      return { success: false, error };
    }
  }

  private generateCacheKey(text: string): string {
    return Buffer.from(text).toString("base64");
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public async cleanupDBCache(): Promise<void> {
    try {
      const client = await PgRawPool.connect();
      await client.query("DELETE FROM embedding_cache");
      client.release();
      log(LogLevel.DEBUG, "DB cache cleaned successfully");
    } catch (error) {
      log(LogLevel.DEBUG, `Failed to clean DB cache: ${error}`);
    }
  }

  public async cleanupCache(): Promise<void> {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Méthodes pour le cache en base de données
  private async getEmbeddingFromDBCache(
    text: string,
  ): Promise<number[] | null> {
    try {
      const client = await PgRawPool.connect();
      const textHash = this.generateTextHash(text);

      const result = await client.query(
        "SELECT embedding FROM embedding_cache WHERE text_hash = $1 AND created_at > NOW() - INTERVAL '24 hours'",
        [textHash],
      );

      client.release();

      if (result.rows.length > 0) {
        return result.rows[0].embedding;
      }

      return null;
    } catch (error) {
      log(LogLevel.DEBUG, `Failed to get embedding from DB cache: ${error}`);
      return null;
    }
  }

  private async saveEmbeddingToDBCache(
    text: string,
    embedding: number[],
  ): Promise<void> {
    try {
      const client = await PgRawPool.connect();
      const textHash = this.generateTextHash(text);

      await client.query(
        "INSERT INTO embedding_cache (text_hash, embedding, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (text_hash) DO UPDATE SET embedding = EXCLUDED.embedding, created_at = NOW()",
        [textHash, embedding],
      );

      client.release();
    } catch (error) {
      log(LogLevel.DEBUG, `Failed to save embedding to DB cache: ${error}`);
    }
  }

  private generateTextHash(text: string): string {
    // Utiliser crypto pour générer un hash plus robuste
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  // Méthode optimisée pour traiter plusieurs batches en parallèle
  public async processMultipleBatches(
    batches: any[][],
    startIndex: number,
    segmentsCount: number,
    options: BatchOptions,
    maxConcurrency: number = 5,
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Traiter les batches par groupes de maxConcurrency
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const batchGroup = batches.slice(i, i + maxConcurrency);

      const batchPromises = batchGroup.map((batch, groupIndex) =>
        this.processEmbeddingBatch(
          batch,
          startIndex + (i + groupIndex) * batch.length,
          segmentsCount,
          options,
        ),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason,
          });
        }
      }
    }

    return results;
  }

  // Méthode optimisée pour les batch updates avec chunking et parallélisation
  public async processOptimizedBatchUpdate(
    embeddings: number[][],
    documents: { id: number; segmentOrder: number }[],
    fileName: string,
    chunkSize: number = 5, // Ultra-réduit pour DB distante (latence réseau)
    maxConcurrency: number = 2, // Concurrence réduite pour DB distante
  ): Promise<{ success: boolean; totalTime: number; chunksProcessed: number }> {
    const startTime = Date.now();

    try {
      // Diviser en chunks pour éviter les requêtes trop lourdes
      const chunks = [];
      for (let i = 0; i < embeddings.length; i += chunkSize) {
        chunks.push({
          embeddings: embeddings.slice(i, i + chunkSize),
          documents: documents.slice(i, i + chunkSize),
          startIndex: i,
        });
      }

      console.log(
        `🚀 [PERF] Traitement optimisé ${fileName}: ${chunks.length} chunks de ${chunkSize} embeddings max (max ${maxConcurrency} concurrent)`,
      );

      // Traitement par groupes de maxConcurrency (comme Bottleneck)
      for (let i = 0; i < chunks.length; i += maxConcurrency) {
        const chunkGroup = chunks.slice(i, i + maxConcurrency);
        const groupNumber = Math.floor(i / maxConcurrency) + 1;
        const totalGroups = Math.ceil(chunks.length / maxConcurrency);

        console.log(
          `🚀 [PERF] Groupe ${groupNumber}/${totalGroups}: ${chunkGroup.length} chunks`,
        );

        const chunkPromises = chunkGroup.map(async (chunk, groupIndex) => {
          const chunkIndex = i + groupIndex;
          const chunkStart = Date.now();

          const client = await PgRawPool.connect();
          try {
            // Préparer les valeurs pour ce chunk (optimisé pour DB distante)
            const values: string[] = [];
            const params: any[] = [];

            for (let j = 0; j < chunk.embeddings.length; j++) {
              const document = chunk.documents[j];
              if (!document) {
                throw new Error(
                  `Document non trouvé pour le segment ${chunk.startIndex + j}`,
                );
              }

              // Format optimisé : moins de paramètres, plus direct
              values.push(
                `($${params.length + 1}::vector(1536), $${params.length + 2}::integer)`,
              );
              params.push(JSON.stringify(chunk.embeddings[j]), document.id);
            }

            // Requête SQL optimisée pour DB distante
            const queryStart = Date.now();
            await client.query(
              `UPDATE "Document" SET embedding = data.embedding FROM (VALUES ${values.join(", ")}) AS data(embedding, id) WHERE "Document".id = data.id`,
              params,
            );
            const queryTime = Date.now() - queryStart;
            console.log(
              `⚡ [PERF] Chunk ${chunkIndex + 1}/${chunks.length} SQL exécuté en ${queryTime}ms (${chunk.embeddings.length} embeddings)`,
            );
          } finally {
            client.release();
          }

          const chunkTime = Date.now() - chunkStart;
          console.log(
            `✅ [PERF] Chunk ${chunkIndex + 1}/${chunks.length} terminé en ${chunkTime}ms`,
          );
        });

        // Attendre que le groupe actuel soit terminé avant de passer au suivant
        await Promise.all(chunkPromises);
        console.error(`✅ [PERF] Groupe ${groupNumber}/${totalGroups} terminé`);
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `✅ [PERF] Batch update optimisé terminé en ${totalTime}ms pour ${embeddings.length} embeddings`,
      );

      return {
        success: true,
        totalTime,
        chunksProcessed: chunks.length,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `❌ [PERF] Erreur batch update optimisé après ${totalTime}ms:`,
        error,
      );
      return {
        success: false,
        totalTime,
        chunksProcessed: 0,
      };
    }
  }
}

export const embeddingsService = EmbeddingsService.getInstance();
