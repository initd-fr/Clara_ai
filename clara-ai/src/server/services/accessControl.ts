import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

/**
 * Contrôle d'accès — App locale : tout autorisé, pas de limites par config.
 */
export class AccessControlService {
  static async getUserSubscriptionConfig(_userId: string) {
    return null;
  }

  static async getMessageLimit(userId: string): Promise<number | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "admin" || user?.role === "support") return null;
    return null; // App locale : illimité
  }

  static async canSendMessage(userId: string): Promise<{
    canSend: boolean;
    reason?: string;
    currentCount: number;
    limit?: number;
  }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { currentDailyMessages: true, lastReset: true, role: true },
    });
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }
    if (user.role === "admin" || user.role === "support") {
      return { canSend: true, currentCount: 0 };
    }
    const now = new Date();
    const lastReset = user.lastReset ?? new Date(0);
    const isNewDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();
    if (isNewDay) {
      await db.user.update({
        where: { id: userId },
        data: { currentDailyMessages: 0, lastReset: now },
      });
      return { canSend: true, currentCount: 0 };
    }
    const currentCount = user.currentDailyMessages ?? 0;
    return { canSend: true, currentCount };
  }

  static async incrementMessageCount(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "admin" || user?.role === "support") return;
    await db.user.update({
      where: { id: userId },
      data: { currentDailyMessages: { increment: 1 } },
    });
  }

  static async canCreatePersonalModels(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "admin" || user?.role === "support") return true;
    return true; // App locale : tout le monde peut créer
  }

  static async canAccessStoreModels(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "admin" || user?.role === "support") return true;
    return true; // App locale : accès à tout
  }

  static async getAccessibleStoreModels(_userId: string) {
    return db.storeModel.findMany({
      where: { isActive: true },
      include: { model: true, category: true },
    });
  }

  static async getStorageLimit(_userId: string): Promise<number | null> {
    return null; // App locale : illimité
  }

  static async getPersonalModelsLimit(_userId: string): Promise<number | null> {
    return null; // App locale : illimité
  }

  static async getCurrentMessageLimit(userId: string): Promise<number | null> {
    return this.getMessageLimit(userId);
  }
}
