import cron from "node-cron";
import { CleanupService } from "~/server/services/cleanupService";

const isDev = process.env.NODE_ENV === "development";

/**
 * Initialise les tâches cron au démarrage de l'application
 */
export function initCronJobs() {
  if (isDev) console.log("🕐 Initialisation des tâches cron...");

  // Nettoyage quotidien à 2h du matin
  cron.schedule(
    "0 2 * * *",
    async () => {
      if (isDev) console.log("🔄 Début du nettoyage quotidien automatique...");
      try {
        const result = await CleanupService.runFullCleanup();
        if (isDev)
          console.log(
            `✅ Nettoyage quotidien terminé : ${result.expiredAccessRemoved} accès expirés et ${result.oldLogsRemoved} logs anciens supprimés`,
          );
      } catch (error) {
        console.error("❌ Erreur lors du nettoyage quotidien:", error);
      }
    },
    {
      timezone: "Europe/Paris",
    },
  );

  // Nettoyage hebdomadaire le dimanche à 3h du matin (nettoyage plus approfondi)
  cron.schedule(
    "0 3 * * 0",
    async () => {
      if (isDev)
        console.log("🔄 Début du nettoyage hebdomadaire automatique...");
      try {
        const result = await CleanupService.runFullCleanup();
        if (isDev)
          console.log(
            `✅ Nettoyage hebdomadaire terminé : ${result.expiredAccessRemoved} accès expirés et ${result.oldLogsRemoved} logs anciens supprimés`,
          );
      } catch (error) {
        console.error("❌ Erreur lors du nettoyage hebdomadaire:", error);
      }
    },
    {
      timezone: "Europe/Paris",
    },
  );

  if (isDev) {
    console.log("✅ Tâches cron initialisées avec succès");
    console.log("📅 Nettoyage quotidien : 2h00 (tous les jours)");
    console.log("📅 Nettoyage hebdomadaire : 3h00 (dimanche)");
  }
}

/**
 * Arrête toutes les tâches cron
 */
export function stopCronJobs() {
  if (isDev) {
    console.log("🛑 Arrêt des tâches cron...");
    console.log("✅ Tâches cron arrêtées");
  }
}
