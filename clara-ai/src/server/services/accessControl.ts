import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export class AccessControlService {
  /**
   * Récupère la configuration d'abonnement d'un utilisateur
   */
  static async getUserSubscriptionConfig(userId: string) {
    const userSubscription = await db.userSubscription.findUnique({
      where: { userId },
      include: {
        config: true,
      },
    });

    return userSubscription?.config || null;
  }

  /**
   * Récupère la limite de messages de l'abonnement d'un utilisateur
   */
  static async getMessageLimit(userId: string): Promise<number | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support n'ont pas de limite
    if (user?.role === "admin" || user?.role === "support") {
      return null; // Illimité
    }

    const config = await this.getUserSubscriptionConfig(userId);

    // Si c'est un abonnement store (accès aux modèles store sans modèles personnels), pas de limite
    if (config?.canAccessStoreModels && !config?.canCreatePersonalModels) {
      return null; // Illimité pour les abonnements store
    }

    return config?.dailyMessageLimit ?? null;
  }

  /**
   * Vérifie si un utilisateur peut envoyer un message
   */
  static async canSendMessage(userId: string): Promise<{
    canSend: boolean;
    reason?: string;
    currentCount: number;
    limit?: number;
  }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        currentDailyMessages: true,
        lastReset: true,
        role: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    // Les admins et support n'ont pas de limite
    if (user.role === "admin" || user.role === "support") {
      return { canSend: true, currentCount: 0 };
    }

    // Récupérer la limite de l'abonnement
    const messageLimit = await this.getMessageLimit(userId);

    // Vérifier si c'est un nouveau jour
    const now = new Date();
    const lastReset = user.lastReset ?? new Date(0);
    const isNewDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      // Réinitialiser le compteur
      await db.user.update({
        where: { id: userId },
        data: {
          currentDailyMessages: 0,
          lastReset: now,
        },
      });
      return { canSend: true, currentCount: 0 };
    }

    const currentCount = user.currentDailyMessages ?? 0;

    // Si pas de limite (null), c'est illimité
    if (messageLimit === null) {
      return { canSend: true, currentCount };
    }

    // Vérifier la limite
    if (currentCount >= messageLimit) {
      return {
        canSend: false,
        reason: `Vous avez atteint la limite quotidienne de ${messageLimit} messages.`,
        currentCount,
        limit: messageLimit,
      };
    }

    return { canSend: true, currentCount, limit: messageLimit };
  }

  /**
   * Incrémente le compteur de messages d'un utilisateur
   */
  static async incrementMessageCount(userId: string): Promise<void> {
    // Optimisation: faire toutes les vérifications en une seule requête
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        userSubscriptions: {
          include: {
            config: {
              select: {
                canAccessStoreModels: true,
                canCreatePersonalModels: true,
              },
            },
          },
        },
      },
    });

    // Les admins et support n'ont pas de compteur
    if (user?.role === "admin" || user?.role === "support") {
      return;
    }

    // Vérifier si c'est un abonnement store (pas de compteur)
    const config = user?.userSubscriptions?.[0]?.config;
    if (config?.canAccessStoreModels && !config?.canCreatePersonalModels) {
      return; // Pas de compteur pour les abonnements store
    }

    await db.user.update({
      where: { id: userId },
      data: {
        currentDailyMessages: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Vérifie si un utilisateur peut créer des modèles personnels
   */
  static async canCreatePersonalModels(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support peuvent toujours créer des modèles
    if (user?.role === "admin" || user?.role === "support") {
      return true;
    }

    const config = await this.getUserSubscriptionConfig(userId);
    return config?.canCreatePersonalModels ?? false;
  }

  /**
   * Vérifie si un utilisateur peut accéder aux modèles store
   */
  static async canAccessStoreModels(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support peuvent toujours accéder aux modèles store
    if (user?.role === "admin" || user?.role === "support") {
      return true;
    }

    const config = await this.getUserSubscriptionConfig(userId);
    return config?.canAccessStoreModels ?? false;
  }

  /**
   * Récupère les modèles store accessibles pour un utilisateur
   */
  static async getAccessibleStoreModels(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support voient tous les modèles store
    if (user?.role === "admin" || user?.role === "support") {
      return db.storeModel.findMany({
        where: {
          isActive: true,
        },
        include: {
          model: true,
          category: true,
        },
      });
    }

    const config = await this.getUserSubscriptionConfig(userId);

    if (!config?.canAccessStoreModels) {
      return [];
    }

    return db.storeModel.findMany({
      where: {
        isActive: true,
        // categoryId: config.categoryId, // Champ categoryId supprimé du schéma
      },
      include: {
        model: true,
        category: true,
      },
    });
  }

  /**
   * Récupère la limite de stockage d'un utilisateur (en GB)
   */
  static async getStorageLimit(userId: string): Promise<number | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support n'ont pas de limite de stockage
    if (user?.role === "admin" || user?.role === "support") {
      return null; // Illimité
    }

    const config = await this.getUserSubscriptionConfig(userId);

    // Si c'est un abonnement store (accès aux modèles store sans modèles personnels), pas de limite
    if (config?.canAccessStoreModels && !config?.canCreatePersonalModels) {
      return null; // Illimité pour les abonnements store
    }

    return config?.storageLimitGB ?? null;
  }

  /**
   * Récupère la limite de modèles personnels d'un utilisateur
   */
  static async getPersonalModelsLimit(userId: string): Promise<number | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Les admins et support n'ont pas de limite de modèles
    if (user?.role === "admin" || user?.role === "support") {
      return null; // Illimité
    }

    const config = await this.getUserSubscriptionConfig(userId);
    return config?.maxPersonalModels ?? null;
  }

  /**
   * Récupère la limite de messages actuelle d'un utilisateur
   */
  static async getCurrentMessageLimit(userId: string): Promise<number | null> {
    return this.getMessageLimit(userId);
  }
}
