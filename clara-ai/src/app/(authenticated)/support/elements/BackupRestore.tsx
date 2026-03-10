"use client";

// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import {
  Download,
  Upload,
  Database,
  HardDrive,
  Settings,
  Shield,
  Archive,
} from "lucide-react";

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

export default function BackupRestore() {
  // ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isBackupLoading, setBackupLoading] = useState(false);
  const [isRestoreLoading, setRestoreLoading] = useState(false);
  const [isFullBackupLoading, setFullBackupLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "sql">("json");
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const { data: tableList, isLoading: isLoadingTables } =
    api.dbBackupRestore.getTables.useQuery();
  const backupTable = api.dbBackupRestore.backupTable.useMutation();
  const restoreTable = api.dbBackupRestore.restoreTable.useMutation();
  const fullBackup = api.dbBackupRestore.fullBackup.useMutation();

  // ~ ///////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  function getCurrentDatePrefix(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minuts = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}-${hour}${minuts}${seconds}_`;
  }

  const handleBackup = async () => {
    if (!selectedTable) {
      toast.error("Veuillez sélectionner une table pour la sauvegarde.");
      return;
    }

    // Préparer le nom de fichier et obtenir le handle AVANT tout await pour conserver le geste utilisateur
    const datePrefixEarly = getCurrentDatePrefix();
    const fileNameEarly = `${datePrefixEarly}${selectedTable}-backup.${exportFormat}`;
    let fileHandle: FileSystemFileHandle | null = null;
    if (window.showSaveFilePicker) {
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: fileNameEarly,
          types: [
            {
              description: exportFormat === "json" ? "JSON Files" : "SQL Files",
              accept: {
                [exportFormat === "json" ? "application/json" : "text/sql"]: [
                  `.${exportFormat}`,
                ],
              },
            },
          ],
        });
      } catch (e) {
        // Si l'utilisateur annule, on continue avec le fallback de téléchargement
        fileHandle = null;
      }
    }

    const toastId = toast.loading("Préparation de la sauvegarde...");
    setBackupLoading(true);

    try {
      const response = await backupTable.mutateAsync({
        tableName: selectedTable,
        format: exportFormat,
      });

      toast.loading("Création du fichier de sauvegarde...", { id: toastId });

      let dataStr: string;
      if (exportFormat === "sql") {
        dataStr = response.data as string;
      } else {
        dataStr = JSON.stringify(response.data, null, 2);
      }

      const blob = new Blob([dataStr], {
        type: exportFormat === "json" ? "application/json" : "text/sql",
      });
      const fileName = fileNameEarly; // garder le préfixe initial pour cohérence

      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success("Sauvegarde effectuée avec succès !", { id: toastId });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Sauvegarde effectuée avec succès !", { id: toastId });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        { id: toastId },
      );
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier pour la restauration.");
      return;
    }

    const toastId = toast.loading("Préparation de la restauration...");
    setRestoreLoading(true);

    try {
      const fileContent = await file.text();
      let parsedData;

      // Si c'est un fichier SQL
      if (file.name.endsWith(".sql")) {
        // Pour les fichiers SQL, on ne peut pas les parser directement
        // On les traite comme une chaîne de caractères
        parsedData = fileContent;
      } else {
        // Pour les fichiers JSON
        try {
          parsedData = JSON.parse(fileContent);
        } catch (error) {
          throw new Error("Le fichier JSON est invalide.");
        }
      }

      toast.loading("Restauration en cours...", { id: toastId });

      // Si c'est un dump complet (objet avec plusieurs tables)
      if (
        typeof parsedData === "object" &&
        !Array.isArray(parsedData) &&
        parsedData.data
      ) {
        await restoreTable.mutateAsync({
          data: parsedData.data,
        });
        toast.success("Restauration complète réussie !", { id: toastId });
      }
      // Si c'est une restauration de table unique
      else if (selectedTable) {
        await restoreTable.mutateAsync({
          tableName: selectedTable,
          data: parsedData,
        });
        toast.success("Restauration réussie !", { id: toastId });
      } else {
        throw new Error(
          "Format de fichier invalide ou table non sélectionnée.",
        );
      }
    } catch (error) {
      console.error("Erreur lors de la restauration :", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la restauration",
        { id: toastId },
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleFullBackup = async () => {
    // Préparer le nom de fichier et obtenir le handle AVANT tout await pour conserver le geste utilisateur
    const datePrefixEarly = getCurrentDatePrefix();
    const fileNameEarly = `${datePrefixEarly}full-database-backup.${exportFormat}`;
    let fileHandle: FileSystemFileHandle | null = null;
    if (window.showSaveFilePicker) {
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: fileNameEarly,
          types: [
            {
              description: exportFormat === "json" ? "JSON Files" : "SQL Files",
              accept: {
                [exportFormat === "json" ? "application/json" : "text/sql"]: [
                  `.${exportFormat}`,
                ],
              },
            },
          ],
        });
      } catch (e) {
        // Si l'utilisateur annule, on continuera avec le fallback de téléchargement
        fileHandle = null;
      }
    }

    const toastId = toast.loading("Préparation du dump complet...");
    setFullBackupLoading(true);

    try {
      const response = await fullBackup.mutateAsync({
        format: exportFormat,
      });

      toast.loading("Création du fichier de sauvegarde...", { id: toastId });

      let dataStr: string;
      if (exportFormat === "sql") {
        dataStr = response.data as string;
      } else {
        dataStr = JSON.stringify(response.data, null, 2);
      }

      const blob = new Blob([dataStr], {
        type: exportFormat === "json" ? "application/json" : "text/sql",
      });
      const fileName = fileNameEarly; // garder le préfixe initial

      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (response.warnings?.length) {
        toast.error(
          `Sauvegarde effectuée avec ${response.warnings.length} avertissement(s). Vérifiez la console pour plus de détails.`,
          { id: toastId, duration: 5000 },
        );
        console.warn("Avertissements de sauvegarde:", response.warnings);
      } else {
        toast.success("Sauvegarde complète effectuée avec succès !", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde complète :", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde complète",
        { id: toastId },
      );
    } finally {
      setFullBackupLoading(false);
    }
  };
  /////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-8">
      {/* Header moderne avec gradient Clara */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-8">
        {/* Éléments décoratifs */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl" />
        <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-accent/40 to-primary/40 blur-lg" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/20">
              <Archive className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-base-content">
                Sauvegarde et Restauration
              </h2>
              <p className="text-lg text-base-content/70">
                Gérez les sauvegardes de votre base de données
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-base-content">
                Sauvegarde sécurisée
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-sm font-medium text-base-content">
                Restauration rapide
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de format moderne */}
      <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm">
        {/* Élément décoratif */}
        <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-base-content">
              Format d&apos;export
            </h3>
          </div>

          <div className="form-control">
            <select
              className="select select-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Format d'export"
              value={exportFormat}
              onChange={(e) =>
                setExportFormat(e.target.value as "json" | "sql")
              }
            >
              <option value="json">JSON - Format structuré</option>
              <option value="sql">SQL - Requêtes de base de données</option>
            </select>
            <p className="mt-1 text-xs text-base-content/60">
              Choisissez le format de sauvegarde selon vos besoins
            </p>
          </div>
        </div>
      </div>

      {/* Section Dump Complet moderne */}
      <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm">
        {/* Élément décoratif */}
        <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 opacity-50 blur-xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10">
              <HardDrive className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Dump Complet
              </h3>
              <p className="text-base-content/70">
                Sauvegardez l&apos;intégralité de la base de données en un seul
                fichier
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-base-300/50 bg-base-100/50 p-4">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Shield className="h-4 w-4 text-success" />
              <span>Inclut toutes les tables et données</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFullBackup}
              disabled={isFullBackupLoading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-secondary/20 to-secondary/10 px-6 py-3 text-secondary ring-1 ring-secondary/20 transition-all hover:from-secondary/30 hover:to-secondary/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isFullBackupLoading}
              aria-disabled={isFullBackupLoading}
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              <div className="relative z-10 flex items-center gap-2">
                {isFullBackupLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary"></div>
                ) : (
                  <HardDrive className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isFullBackupLoading ? "Sauvegarde..." : "Dump Complet"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Section Sauvegarde/Restauration par table moderne */}
      <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm">
        {/* Élément décoratif */}
        <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-accent/20 to-info/20 opacity-50 blur-xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/10">
              <Database className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Sauvegarde par table
              </h3>
              <p className="text-base-content/70">
                Sauvegardez ou restaurez une table spécifique
              </p>
            </div>
          </div>

          {/* Sélection de la table */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-base-content/70"
              htmlFor="table-select"
            >
              Table à sauvegarder/restaurer *
            </label>
            {isLoadingTables ? (
              <div className="h-12 w-full animate-pulse rounded-lg bg-base-300/50"></div>
            ) : (
              <select
                className="select select-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                id="table-select"
                value={selectedTable || ""}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">-- Sélectionner une table --</option>
                {tableList?.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-base-content/60">
              Choisissez la table que vous souhaitez sauvegarder
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleBackup}
              disabled={!selectedTable || isBackupLoading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 px-6 py-3 text-accent ring-1 ring-accent/20 transition-all hover:from-accent/30 hover:to-accent/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isBackupLoading}
              aria-disabled={!selectedTable || isBackupLoading}
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              <div className="relative z-10 flex items-center gap-2">
                {isBackupLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isBackupLoading ? "Sauvegarde..." : "Sauvegarder"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Section Restauration moderne */}
      <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm">
        {/* Élément décoratif */}
        <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-info/20 to-primary/20 opacity-50 blur-xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-info/20 to-info/10">
              <Upload className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Restauration
              </h3>
              <p className="text-base-content/70">
                Restaurez une table individuelle ou un dump complet
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-base-content/70"
              htmlFor="backup-file"
            >
              Fichier de sauvegarde *
            </label>
            <input
              type="file"
              accept=".json,.sql,application/json,text/sql"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file-input file-input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              id="backup-file"
            />
            <p className="text-xs text-base-content/60">
              Formats acceptés : JSON (.json) ou SQL (.sql)
            </p>
            {file && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                <div className="flex items-center gap-2 text-sm text-success">
                  <Shield className="h-4 w-4" />
                  <span>Fichier sélectionné : {file.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRestore}
              disabled={!file || isRestoreLoading}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-info/20 to-info/10 px-6 py-3 text-info ring-1 ring-info/20 transition-all hover:from-info/30 hover:to-info/20 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isRestoreLoading}
              aria-disabled={!file || isRestoreLoading}
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              <div className="relative z-10 flex items-center gap-2">
                {isRestoreLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-info/30 border-t-info"></div>
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isRestoreLoading ? "Restauration..." : "Restaurer"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
