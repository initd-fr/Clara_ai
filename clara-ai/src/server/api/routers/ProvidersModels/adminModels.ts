//TODO Controller qui permet de gérer les models LLM disponible sur l'application
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

// ? ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
// Schémas Zod optimisés pour les performances
const baseLlmSchema = {
  value: z.string(),
  label: z.string(),
  text: z.string(),
  provider: z.string(),
  maxInputTokens: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  useOnlyHumanMessage: z.boolean().default(false),
} as const;

const createLlmSchema = z.object({
  ...baseLlmSchema,
  className: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updateLlmSchema = z.object({
  id: z.number().int().positive(),
  ...baseLlmSchema,
  className: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
});

const toggleEnableSchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean(),
});

const deleteLlmSchema = z.object({
  id: z.number().int().positive(),
});

const setDefaultLlmSchema = z.object({
  id: z.number().int().positive(),
});
// ? ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
// ^  ////////////////////////////////////////////////////////////////////////CLASS/////////////////////////////////////////////////////////////////////////////////////////

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

export const adminModelsRouter = createTRPCRouter({
  // Récupérer tous les iaLlm triés par ID
  getAll: protectedProcedure.query(async ({ ctx: { db } }) => {
    return db.iaLlm.findMany({
      select: {
        id: true,
        value: true,
        label: true,
        text: true,
        className: true,
        provider: true,
        enabled: true,
        isDefault: true,
        description: true,
        providerRelation: {
          select: {
            value: true,
            label: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
  }),

  // Créer un nouveau LLM
  create: protectedProcedure
    .input(createLlmSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return await db.$transaction(async (tx) => {
        // Si on définit ce LLM comme par défaut, désactiver tous les autres
        if (input.isDefault) {
          await tx.iaLlm.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }

        const newLLM = await tx.iaLlm.create({
          data: input,
          include: {
            providerRelation: true,
          },
        });
        return newLLM;
      });
    }),

  // Editer un LLM
  update: protectedProcedure
    .input(updateLlmSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, value, ...data } = input;

      // Vérifier si le LLM existe
      const existingLlm = await db.iaLlm.findUnique({
        where: { id },
      });

      if (!existingLlm) {
        throw new Error("LLM introuvable");
      }

      // Si la valeur change, vérifier qu'elle n'existe pas déjà
      if (value !== existingLlm.value) {
        const valueExists = await db.iaLlm.findUnique({
          where: { value },
        });

        if (valueExists) {
          throw new Error(`Un modèle avec la valeur "${value}" existe déjà`);
        }
      }

      // Mise à jour du LLM
      try {
        return await db.$transaction(async (tx) => {
          // Si on définit ce LLM comme par défaut, désactiver tous les autres
          if (data.isDefault) {
            await tx.iaLlm.updateMany({
              where: {
                isDefault: true,
                id: { not: id }, // Exclure le LLM actuel
              },
              data: { isDefault: false },
            });
          }

          // Mettre à jour le LLM
          const updatedLLM = await tx.iaLlm.update({
            where: { id },
            data: {
              value,
              ...data,
            },
          });

          return updatedLLM;
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Erreur lors de la mise à jour du LLM: ${error.message}`,
          );
        }
        throw new Error(
          "Une erreur inattendue s'est produite lors de la mise à jour du LLM",
        );
      }
    }),

  // Activer ou désactiver un LLM
  toggleEnable: protectedProcedure
    .input(toggleEnableSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return db.iaLlm.update({
        where: { id: input.id },
        data: { enabled: input.enabled },
      });
    }),

  // Supprimer un LLM
  delete: protectedProcedure
    .input(deleteLlmSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const llm = await db.iaLlm.findUnique({
        where: { id: input.id },
        include: {
          models: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!llm) {
        throw new Error("LLM introuvable");
      }

      // Vérifier si c'est le LLM par défaut
      if (llm.isDefault) {
        throw new Error(
          "Impossible de supprimer le LLM par défaut. Veuillez d'abord définir un autre LLM comme par défaut.",
        );
      }

      // Supprimer le LLM en utilisant une transaction pour s'assurer de la cohérence
      return await db.$transaction(async (tx) => {
        // Si des modèles utilisent ce LLM, les migrer vers le LLM par défaut
        if (llm.models.length > 0) {
          // Récupérer le LLM par défaut
          const defaultLlm = await tx.iaLlm.findFirst({
            where: { isDefault: true },
            select: { value: true, label: true },
          });

          if (!defaultLlm) {
            throw new Error(
              "Aucun LLM par défaut trouvé. Veuillez d'abord définir un LLM par défaut avant de supprimer ce LLM.",
            );
          }

          // Migrer tous les modèles vers le LLM par défaut
          await tx.models.updateMany({
            where: { modelName: llm.value },
            data: { modelName: defaultLlm.value },
          });

          console.log(
            `✅ ${llm.models.length} modèle(s) migré(s) vers le LLM par défaut: ${defaultLlm.label}`,
          );
        }

        // Puis supprimer le LLM
        return await tx.iaLlm.delete({
          where: { id: input.id },
        });
      });
    }),

  // Définir un LLM comme par défaut
  setDefault: protectedProcedure
    .input(setDefaultLlmSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const llm = await db.iaLlm.findUnique({
        where: { id: input.id },
        select: { id: true, label: true, enabled: true },
      });

      if (!llm) {
        throw new Error("LLM introuvable");
      }

      if (!llm.enabled) {
        throw new Error(
          "Impossible de définir un LLM désactivé comme par défaut. Veuillez d'abord l'activer.",
        );
      }

      return await db.$transaction(async (tx) => {
        // Désactiver tous les autres LLMs par défaut
        await tx.iaLlm.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });

        // Définir ce LLM comme par défaut
        return await tx.iaLlm.update({
          where: { id: input.id },
          data: { isDefault: true },
        });
      });
    }),
});
