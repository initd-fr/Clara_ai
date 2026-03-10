import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

const providerSchema = z.object({
  value: z.string(),
  label: z.string(),
  text: z.string(),
  enabled: z.boolean(),
});

export const providerRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.iaProvider.findMany({
      select: {
        id: true,
        value: true,
        label: true,
        text: true,
        enabled: true,
      },
    });
  }),

  create: protectedProcedure
    .input(providerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Vérifier si un provider avec la même valeur existe déjà
        const existingProvider = await ctx.db.iaProvider.findUnique({
          where: { value: input.value },
        });

        if (existingProvider) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un provider avec cette valeur existe déjà",
          });
        }

        return await ctx.db.iaProvider.create({
          data: {
            value: input.value,
            label: input.label,
            text: input.text,
            enabled: input.enabled,
          },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du provider",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(providerSchema.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Vérifier si un autre provider avec la même valeur existe déjà
        const existingProvider = await ctx.db.iaProvider.findFirst({
          where: {
            value: input.value,
            id: { not: input.id },
          },
        });

        if (existingProvider) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un provider avec cette valeur existe déjà",
          });
        }

        return await ctx.db.iaProvider.update({
          where: { id: input.id },
          data: {
            value: input.value,
            label: input.label,
            text: input.text,
            enabled: input.enabled,
          },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du provider",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const provider = await ctx.db.iaProvider.findFirst({
          where: { value: input },
        });

        if (!provider) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Provider non trouvé",
          });
        }

        return await ctx.db.iaProvider.delete({
          where: { id: provider.id },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du provider",
          cause: error,
        });
      }
    }),
});
