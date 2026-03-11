import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { settingsManager } from "~/server/api/routers/Settings/settingsManager";

export const settingsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    const settings = await db.setting.findMany({
      include: {
        categoryRelation: true,
      },
      orderBy: [{ categoryId: "asc" }, { key: "asc" }],
    });
    const groupedSettings: Record<
      string,
      {
        key: string;
        value: string;
        isNumber: boolean;
        toolType: string;
        categoryId: number | null;
      }[]
    > = {};
    settings.forEach((setting) => {
      const categoryName = setting.categoryRelation?.name || "Uncategorized";
      if (!groupedSettings[categoryName]) {
        groupedSettings[categoryName] = [];
      }
      groupedSettings[categoryName]?.push({
        key: setting.key,
        value: setting.value,
        isNumber: setting.isNumber,
        toolType: setting.toolType,
        categoryId: setting.categoryId ?? null,
      });
    });
    return groupedSettings;
  }),

  update: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quickKeys = ["SpeedCreate_DefaultModel", "RAG_SimilarityThreshold"];
      const result = quickKeys.includes(input.key)
        ? await ctx.db.setting.upsert({
            where: { key: input.key },
            update: { value: input.value },
            create: {
              key: input.key,
              value: input.value,
              isNumber: input.key === "RAG_SimilarityThreshold",
              toolType: "default",
            },
          })
        : await ctx.db.setting.update({
            where: { key: input.key },
            data: { value: input.value },
          });
      await settingsManager.set(input.key, input.value);
      return result;
    }),

  create: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.setting.create({
        data: {
          key: input.key,
          value: input.value,
        },
      });
      await settingsManager.set(input.key, input.value);
      return result;
    }),
});
