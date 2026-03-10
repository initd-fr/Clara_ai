// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

export const logRouter = createTRPCRouter({
  createLog: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        modelType: z.string().optional(),
        modelId: z.number().optional(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const { action, modelType, modelId, firstName, lastName, email } = input;
      const userId = session.user.id;
      const log = await db.userLogs.create({
        data: {
          userId,
          action,
          modelType: modelType ?? "",
          modelId: modelId ?? 0,
          firstName,
          lastName,
          email,
        },
      });
      return log;
    }),
  getLogs: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    // Si l'utilisateur est un support ou un admin, on récupère tous les logs
    if (session.user.role === "support" || session.user.role === "admin") {
      const logs = await db.userLogs.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      return logs;
    }

    // Sinon, on renvois une erreur
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Vous n'avez pas les permissions pour accéder à cette ressource",
    });
  }),
  getLogsByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx: { db, session }, input }) => {
      if (session.user.role === "support" || session.user.role === "admin") {
        const { userId } = input;
        const logs = await db.userLogs.findMany({
          where: { userId },
          orderBy: {
            createdAt: "desc",
          },
        });
        return logs;
      }

      // Sinon, on renvois une erreur
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          "Vous n'avez pas les permissions pour accéder à cette ressource",
      });
    }),
});
