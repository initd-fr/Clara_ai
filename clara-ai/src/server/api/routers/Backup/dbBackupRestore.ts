import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Pool } from "pg";

// Configuration optimisée de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Nombre maximum de connexions
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30 secondes
  connectionTimeoutMillis: 2000, // Timeout de connexion de 2 secondes
});

// Ordre des tables pour la restauration (basé sur les dépendances)
const TABLE_ORDER = [
  "SettingsCategory",
  "Setting",
  "iaProvider",
  "iaLlm",
  "User",
  "Account",
  "Models",
  "Document",
  "Message",
  "MessageDocument",
];

// Définir les types pour les données de la base de données
type DatabaseRow = Record<string, any>;
type TableData = DatabaseRow[];

// Fait la liste des tables dynamiquement depuis la base de données
async function getTablesFromDatabase(): Promise<string[]> {
  const result = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
  );
  const tables = result.rows.map((row) => row.table_name);
  // Trier les tables selon l'ordre défini
  return tables.sort((a, b) => {
    const indexA = TABLE_ORDER.indexOf(a);
    const indexB = TABLE_ORDER.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

// Fonction pour récupérer toutes les données d'une table avec pagination optimisée
async function getAllTableData(tableName: string): Promise<TableData> {
  const batchSize = 500; // Taille de lot réduite pour une meilleure gestion de la mémoire
  let offset = 0;
  const allData: TableData = [];

  // Utiliser une requête préparée pour la pagination
  const countQuery = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
  const totalRows = parseInt(countQuery.rows[0].count);

  // Si la table est vide, retourner immédiatement
  if (totalRows === 0) return allData;

  // Créer une requête préparée pour la pagination
  const baseQuery =
    tableName === "Document"
      ? `SELECT id, "createdAt", "updatedAt", "name", "minioPath", "mimeType", "size", "modelId" FROM "Document"`
      : `SELECT * FROM "${tableName}"`;

  const preparedQuery = `${baseQuery} LIMIT $1 OFFSET $2`;

  while (offset < totalRows) {
    const result = await pool.query(preparedQuery, [batchSize, offset]);
    if (result.rows.length === 0) break;

    allData.push(...result.rows);
    offset += batchSize;
  }

  return allData;
}

// Fonction optimisée pour la conversion en SQL
function convertToSQL(tableName: string, data: any[]): string {
  if (data.length === 0) return "";

  const columns = Object.keys(data[0] || {});
  const values = [];
  const batchSize = 100; // Taille de lot pour les INSERT

  // Préparer les colonnes une seule fois
  const columnsStr = columns.map((col) => `"${col}"`).join(", ");

  // Diviser les données en lots
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchValues = batch.map((row) => {
      const rowValues = columns.map((col) => {
        const value = row[col];
        if (value === null) return "NULL";
        if (typeof value === "string") {
          if (
            col.toLowerCase().includes("id") &&
            value.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            )
          ) {
            return `'${value}'::uuid`;
          }
          return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === "object") {
          if (
            Array.isArray(value) &&
            tableName === "Document" &&
            col === "embedding"
          ) {
            return `'${JSON.stringify(value)}'::vector`;
          }
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        }
        return value;
      });
      return `(${rowValues.join(", ")})`;
    });

    values.push(
      `INSERT INTO "${tableName}" (${columnsStr})\nVALUES\n${batchValues.join(",\n")};`,
    );
  }

  return values.join("\n\n");
}

// Fonction optimisée pour la restauration
async function restoreTableData(tableName: string, data: any[], client: any) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const batchSize = 100; // Taille de lot pour les INSERT
  const columnsStr = columns.map((col) => `"${col}"`).join(", ");

  // Préparer la requête d'insertion
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const insertQuery = `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholders})`;

  // Diviser les données en lots et les insérer
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map((row) =>
      columns.map((col) => {
        const value = row[col];
        if (value === null) return null;
        if (typeof value === "string") {
          if (
            col.toLowerCase().includes("id") &&
            value.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            )
          ) {
            return value;
          }
          return value.replace(/'/g, "''");
        }
        if (typeof value === "object") {
          if (
            Array.isArray(value) &&
            tableName === "Document" &&
            col === "embedding"
          ) {
            return JSON.stringify(value);
          }
          return JSON.stringify(value).replace(/'/g, "''");
        }
        return value;
      }),
    );

    // Utiliser une requête préparée pour chaque lot
    await client.query(insertQuery, values);
  }
}

export const dbBackupRestore = createTRPCRouter({
  getTables: protectedProcedure.query(async () => {
    const tables = await getTablesFromDatabase();
    return tables;
  }),

  backupTable: protectedProcedure
    .input(
      z.object({
        tableName: z.string(),
        format: z.enum(["json", "sql"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { tableName, format } = input;

      try {
        const tables = await getTablesFromDatabase();
        if (!tables.includes(tableName)) {
          throw new Error(`La table "${tableName}" n'existe pas.`);
        }

        const data = await getAllTableData(tableName);

        if (format === "sql") {
          return { success: true, data: convertToSQL(tableName, data) };
        }
        return { success: true, data };
      } catch (error) {
        console.error("Erreur lors du backup:", error);
        throw new Error(
          `Erreur lors de la sauvegarde des données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        );
      }
    }),

  restoreTable: protectedProcedure
    .input(
      z.object({
        tableName: z.string().optional(),
        data: z.union([
          z.array(z.record(z.any())),
          z.record(z.string(), z.array(z.record(z.any()))),
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const { tableName, data } = input;
      const errors: string[] = [];
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query("SET CONSTRAINTS ALL DEFERRED");

        if (tableName) {
          if (!Array.isArray(data)) {
            throw new Error(
              "Format de données invalide pour une table unique.",
            );
          }

          try {
            await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
            await restoreTableData(tableName, data, client);
          } catch (error) {
            errors.push(
              `Erreur lors de la restauration de la table ${tableName}: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
            );
          }
        } else {
          if (!(data instanceof Object)) {
            throw new Error("Format de données invalide pour un dump complet.");
          }

          const tables = await getTablesFromDatabase();
          for (const table of tables) {
            const tableData = (data as Record<string, TableData>)[table];
            if (!tableData) continue;

            if (!Array.isArray(tableData)) {
              errors.push(
                `Format de données invalide pour la table "${table}".`,
              );
              continue;
            }

            try {
              await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
              await restoreTableData(table, tableData, client);
            } catch (error) {
              errors.push(
                `Erreur lors de la restauration de la table ${table}: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
              );
            }
          }
        }

        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        await client.query("COMMIT");

        if (errors.length > 0) {
          return { success: false, errors };
        }
        return { success: true };
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(
          `Erreur lors de la restauration des données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        );
      } finally {
        client.release();
      }
    }),

  fullBackup: protectedProcedure
    .input(
      z.object({
        format: z.enum(["json", "sql"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { format } = input;
      const errors: string[] = [];

      try {
        const tables = await getTablesFromDatabase();
        const backupData: Record<string, any[]> = {};

        if (format === "sql") {
          const sqlStatements: string[] = [];

          for (const table of tables) {
            try {
              const data = await getAllTableData(table);
              if (data.length > 0) {
                sqlStatements.push(convertToSQL(table, data));
              }
            } catch (error) {
              const errorMessage = `Erreur lors de la sauvegarde de la table ${table}: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
              console.warn(errorMessage);
              errors.push(errorMessage);
            }
          }

          if (errors.length > 0) {
            console.warn("Erreurs rencontrées lors de la sauvegarde:", errors);
          }

          return {
            success: errors.length === 0,
            data: sqlStatements.join("\n\n"),
            warnings: errors.length > 0 ? errors : undefined,
          };
        }

        // Format JSON
        for (const table of tables) {
          try {
            backupData[table] = await getAllTableData(table);
          } catch (error) {
            const errorMessage = `Erreur lors de la sauvegarde de la table ${table}: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
            console.warn(errorMessage);
            errors.push(errorMessage);
          }
        }

        if (errors.length > 0) {
          console.warn("Erreurs rencontrées lors de la sauvegarde:", errors);
        }

        return {
          success: errors.length === 0,
          data: backupData,
          warnings: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        console.error("Erreur lors du dump complet:", error);
        throw new Error(
          `Erreur lors de la sauvegarde complète de la base de données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        );
      }
    }),
});
