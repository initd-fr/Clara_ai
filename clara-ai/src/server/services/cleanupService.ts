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

  /**
   * Nettoie les abonnements d'essai expirés pour un utilisateur spécifique
   */
  static async cleanupUserExpiredSubscriptions(userId: string) {
    try {
      // Récupérer l'abonnement par défaut
      const defaultSubscription = await db.subscriptionConfig.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (!defaultSubscription) {
        console.log("⚠️ Aucun abonnement par défaut configuré");
        return { removed: 0 };
      }

      // Récupérer les abonnements expirés de cet utilisateur
      const expiredSubscriptions = await db.userSubscription.findMany({
        where: {
          userId,
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          config: {
            select: { name: true },
          },
        },
      });

      if (expiredSubscriptions.length === 0) {
        return { removed: 0 };
      }

      console.log(
        `📊 ${expiredSubscriptions.length} abonnements expirés trouvés pour l'utilisateur ${userId}`,
      );

      // Supprimer les abonnements expirés et remettre sur l'abonnement par défaut
      for (const subscription of expiredSubscriptions) {
        // Supprimer l'abonnement expiré
        await db.userSubscription.delete({
          where: { id: subscription.id },
        });

        // Créer l'abonnement par défaut
        await db.userSubscription.create({
          data: {
            userId: subscription.userId,
            configId: defaultSubscription.id,
            status: "active",
            expiresAt: null, // Pas d'expiration pour l'abonnement par défaut
          },
        });

        // Mettre à jour l'utilisateur
        await db.user.update({
          where: { id: subscription.userId },
          data: {
            accountType: defaultSubscription.name,
          },
        });

        // Créer le log
        await db.userLogs.create({
          data: {
            userId: subscription.userId,
            action: "AUTO_REVERT_TO_DEFAULT",
            description: `Abonnement d'essai "${subscription.config.name}" expiré, retour automatique vers l'abonnement par défaut "${defaultSubscription.name}" lors de la connexion`,
            firstName: "Système",
            lastName: "Automatique",
            email: "system@clara-ai.com",
          },
        });

        console.log(
          `📝 Abonnement expiré traité lors de la connexion: ${subscription.userId} -> ${defaultSubscription.name}`,
        );
      }

      return { removed: expiredSubscriptions.length };
    } catch (error) {
      console.error(
        "Erreur lors du nettoyage des abonnements expirés de l'utilisateur:",
        error,
      );
      throw error;
    }
  }

  /**
   * Nettoie les abonnements d'essai expirés et remet les utilisateurs sur l'abonnement par défaut
   */
  static async cleanupExpiredSubscriptions() {
    try {
      console.log("🔄 Début du nettoyage des abonnements expirés...");

      // Récupérer l'abonnement par défaut
      const defaultSubscription = await db.subscriptionConfig.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (!defaultSubscription) {
        console.log("⚠️ Aucun abonnement par défaut configuré");
        return { removed: 0, logs: [] };
      }

      // Récupérer les abonnements expirés
      const expiredSubscriptions = await db.userSubscription.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
          config: {
            select: { name: true },
          },
        },
      });

      console.log(
        `📊 ${expiredSubscriptions.length} abonnements expirés trouvés`,
      );

      if (expiredSubscriptions.length === 0) {
        console.log("✅ Aucun abonnement expiré à nettoyer");
        return { removed: 0, logs: [] };
      }

      // Supprimer les abonnements expirés et remettre sur l'abonnement par défaut
      const logs = [];
      for (const subscription of expiredSubscriptions) {
        // Supprimer l'abonnement expiré
        await db.userSubscription.delete({
          where: { id: subscription.id },
        });

        // Créer l'abonnement par défaut
        await db.userSubscription.create({
          data: {
            userId: subscription.userId,
            configId: defaultSubscription.id,
            status: "active",
            expiresAt: null, // Pas d'expiration pour l'abonnement par défaut
          },
        });

        // Mettre à jour l'utilisateur
        await db.user.update({
          where: { id: subscription.userId },
          data: {
            accountType: defaultSubscription.name,
          },
        });

        // Créer le log
        const log = await db.userLogs.create({
          data: {
            userId: subscription.userId,
            action: "AUTO_REVERT_TO_DEFAULT",
            description: `Abonnement d'essai "${subscription.config.name}" expiré, retour automatique vers l'abonnement par défaut "${defaultSubscription.name}"`,
            firstName: "Système",
            lastName: "Automatique",
            email: "system@clara-ai.com",
          },
        });
        logs.push(log);

        console.log(
          `📝 Abonnement expiré traité: ${subscription.user.email} -> ${defaultSubscription.name}`,
        );
      }

      console.log("✅ Nettoyage des abonnements expirés terminé");
      return { removed: expiredSubscriptions.length, logs };
    } catch (error) {
      console.error(
        "❌ Erreur lors du nettoyage des abonnements expirés:",
        error,
      );
      throw error;
    }
  }

  /**
   * Exécute tous les nettoyages
   */
  static async runFullCleanup() {
    try {
      console.log("🔄 Début du nettoyage complet...");

      const [expiredAccessResult, oldLogsResult, expiredSubscriptionsResult] =
        await Promise.all([
          this.cleanupExpiredAccess(),
          this.cleanupOldLogs(),
          this.cleanupExpiredSubscriptions(),
        ]);

      console.log("✅ Nettoyage complet terminé avec succès");
      console.log(
        `📊 Résumé: ${expiredAccessResult.removed} accès expirés, ${oldLogsResult.removed} logs anciens, ${expiredSubscriptionsResult.removed} abonnements expirés`,
      );

      return {
        expiredAccessRemoved: expiredAccessResult.removed,
        oldLogsRemoved: oldLogsResult.removed,
        expiredSubscriptionsRemoved: expiredSubscriptionsResult.removed,
      };
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage complet:", error);
      throw error;
    }
  }
}
