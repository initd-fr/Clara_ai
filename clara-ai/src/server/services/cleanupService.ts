import { db } from "~/server/db";

export class CleanupService {
  /**
   * Nettoie les accès expirés aux modèles store
   */
  static async cleanupExpiredAccess() {
    try {
      console.log("🔄 Début du nettoyage des accès expirés...");

      // Récupérer les accès expirés
      const expiredAccess = await db.storeAccess.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          model: {
            select: { name: true },
          },
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      });

      console.log(`📊 ${expiredAccess.length} accès expirés trouvés`);

      if (expiredAccess.length === 0) {
        console.log("✅ Aucun accès expiré à nettoyer");
        return { removed: 0, logs: [] };
      }

      // Supprimer les accès expirés
      await db.storeAccess.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`🗑️ ${expiredAccess.length} accès expirés supprimés`);

      // Créer les logs de suppression
      const logs = [];
      for (const access of expiredAccess) {
        const log = await db.userLogs.create({
          data: {
            userId: access.userId,
            action: "AUTO_REVOKE_ACCESS",
            modelType: "STORE_EXPERT",
            modelId: access.modelId,
            firstName: "Système",
            lastName: "Automatique",
            email: "system@clara-ai.com",
            description: `Accès expiré automatiquement supprimé pour le modèle "${access.model.name}" - Utilisateur: ${access.user.email}`,
          },
        });
        logs.push(log);

        // Log système pour tracer
        console.log(
          `📝 Log créé pour la suppression de l'accès: ${access.user.email} -> ${access.model.name}`,
        );
      }

      // Créer un log de suivi général pour tracer le nettoyage
      if (expiredAccess.length > 0 && expiredAccess[0]) {
        const firstUser = expiredAccess[0];
        await db.userLogs.create({
          data: {
            userId: firstUser.userId,
            action: "SYSTEM_CLEANUP",
            modelType: "SYSTEM",
            modelId: 0,
            firstName: "Système",
            lastName: "Automatique",
            email: "system@clara-ai.com",
            description: `Nettoyage automatique terminé : ${expiredAccess.length} accès expirés supprimés`,
          },
        });
        console.log(`📋 Log de suivi créé pour le nettoyage automatique`);
      }

      console.log("✅ Nettoyage des accès expirés terminé");
      return { removed: expiredAccess.length, logs };
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage des accès expirés:", error);
      throw error;
    }
  }

  /**
   * Nettoie les logs de plus de 30 jours
   */
  static async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await db.userLogs.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      return { removed: result.count };
    } catch (error) {
      console.error("Erreur lors du nettoyage des logs anciens:", error);
      throw error;
    }
  }

  /**
   * Nettoie les accès expirés pour un utilisateur spécifique
   */
  static async cleanupUserExpiredAccess(userId: string) {
    try {
      const expiredAccess = await db.storeAccess.findMany({
        where: {
          userId,
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          model: {
            select: { name: true },
          },
        },
      });

      if (expiredAccess.length === 0) {
        return { removed: 0 };
      }

      // Supprimer les accès expirés de cet utilisateur
      await db.storeAccess.deleteMany({
        where: {
          userId,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // Créer les logs de suppression
      for (const access of expiredAccess) {
        await db.userLogs.create({
          data: {
            userId,
            action: "AUTO_REVOKE_ACCESS",
            modelType: "STORE_EXPERT",
            modelId: access.modelId,
            firstName: "Système",
            lastName: "Automatique",
            email: "system@clara-ai.com",
            description: `Accès expiré automatiquement supprimé pour le modèle "${access.model.name}" lors de la connexion`,
          },
        });
      }

      return { removed: expiredAccess.length };
    } catch (error) {
      console.error(
        "Erreur lors du nettoyage des accès expirés de l'utilisateur:",
        error,
      );
      throw error;
    }
  }

  /** App locale : plus de nettoyage de configs expirées */
  static async cleanupUserExpiredSubscriptions(_userId: string) {
    return { removed: 0 };
  }

  /** App locale : plus de nettoyage de configs expirées */
  static async cleanupExpiredSubscriptions() {
    return { removed: 0, logs: [] };
  }

  /**
   * Exécute les nettoyages (app locale : accès expirés + vieux logs uniquement)
   */
  static async runFullCleanup() {
    try {
      console.log("🔄 Nettoyage...");
      const [expiredAccessResult, oldLogsResult] = await Promise.all([
        this.cleanupExpiredAccess(),
        this.cleanupOldLogs(),
      ]);
      console.log(
        `✅ Nettoyage terminé: ${expiredAccessResult.removed} accès expirés, ${oldLogsResult.removed} logs anciens`,
      );
      return {
        expiredAccessRemoved: expiredAccessResult.removed,
        oldLogsRemoved: oldLogsResult.removed,
      };
    } catch (error) {
      console.error("❌ Erreur nettoyage:", error);
      throw error;
    }
  }
}
