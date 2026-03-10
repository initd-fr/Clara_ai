import { settingsManager } from "~/server/api/routers/Settings/settingsManager";
import { log, LogLevel } from "~/globalUtils/debug";
import { db } from "~/server/db";

export async function getLastExchanges(
  userId: string,
  conversationId: string,
  limit: number,
  isStoreChat: boolean = false,
): Promise<{ lastExchanges: string }> {
  try {
    const maxHistory =
      (await settingsManager.get<number>("chat_maxHistory")) ?? 10;
    const actualLimit = Math.min(limit, maxHistory);

    // Optimisation: utiliser Prisma au lieu de PgRawPool pour de meilleures performances
    let lastMessages;

    if (isStoreChat) {
      // Pour les chats store, utiliser la table StoreChatMessage
      lastMessages = await db.storeChatMessage.findMany({
        where: {
          storeChatId: parseInt(conversationId),
          userId: userId,
        },
        select: {
          content: true,
          isBot: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: actualLimit,
      });
    } else {
      // Pour les modèles personnels, utiliser la table Message
      lastMessages = await db.message.findMany({
        where: {
          modelId: parseInt(conversationId),
          userId: userId,
        },
        select: {
          content: true,
          isBot: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: actualLimit,
      });
    }

    if (!lastMessages || lastMessages.length === 0) {
      return { lastExchanges: "" };
    }

    const formattedMessages = lastMessages
      .map((msg) => `${msg.isBot ? "Assistant" : "User"}: ${msg.content}`)
      .join("\n");

    return { lastExchanges: formattedMessages };
  } catch (error) {
    log(
      LogLevel.ERROR,
      `getLastExchanges failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return { lastExchanges: "" };
  }
}

// Fonction spécifique pour les chats store
export async function getStoreChatLastExchanges(
  userId: string,
  storeChatId: string,
  limit: number,
): Promise<{ lastExchanges: string }> {
  return getLastExchanges(userId, storeChatId, limit, true);
}
