// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
export const messagesRouter = createTRPCRouter({
  //& Récupérer les messages d'un modèle spécifique
  getModelMessages: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Correction TS : accès sécurisé à user
      const sessionUser =
        typeof ctx.session === "object" &&
        ctx.session !== null &&
        "user" in ctx.session
          ? (ctx.session as any).user
          : undefined;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      return await ctx.db.message.findMany({
        where: {
          modelId: input.modelId,
          userId: userId,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          document: true,
        },
      });
    }),
  //& Sauvegarder un nouveau message
  saveMessage: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        isBot: z.boolean(),
        modelId: z.number(),
        document: z
          .object({
            title: z.string(),
            content: z.string(),
            url: z.string().optional(),
            mimeType: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Correction TS : accès sécurisé à user
      const sessionUser =
        typeof ctx.session === "object" &&
        ctx.session !== null &&
        "user" in ctx.session
          ? (ctx.session as any).user
          : undefined;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      const newMessage = await ctx.db.message.create({
        data: {
          content: input.content,
          isBot: input.isBot,
          modelId: input.modelId,
          userId: userId,
          document: input.document
            ? {
                create: input.document,
              }
            : undefined,
        },
      });
      return newMessage;
    }),
  //& Supprimer les messages d'un modèle spécifique
  clearModelMessages: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Correction TS : accès sécurisé à user
      const sessionUser =
        typeof ctx.session === "object" &&
        ctx.session !== null &&
        "user" in ctx.session
          ? (ctx.session as any).user
          : undefined;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      const result = await ctx.db.message.deleteMany({
        where: {
          modelId: input.modelId,
          userId: userId,
        },
      });

      return result;
    }),
  //& Supprimer un message par son ID
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Correction TS : accès sécurisé à user
      const sessionUser =
        typeof ctx.session === "object" &&
        ctx.session !== null &&
        "user" in ctx.session
          ? (ctx.session as any).user
          : undefined;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      const result = await ctx.db.message.delete({
        where: {
          id: input.messageId,
          userId: userId,
        },
      });

      return result;
    }),
});
