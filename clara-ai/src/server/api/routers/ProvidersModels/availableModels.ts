//TODO Controller pour les modèles LLM disponibles pour chaque accountType
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

// ? ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type IaLlm = {
  id: number;
  value: string;
  label: string;
  text: string;
  className: string;
  enabled: boolean;
  isDefault: boolean;
  maxInputTokens: number;
  maxOutputTokens: number;
  description: string;
  providerRelation: {
    value: string;
    label: string;
    text: string;
    className: string;
    enabled: boolean;
  };
};

type ProviderInfo = {
  providerLabel: string;
  providerText: string;
  providerClassName: string;
  providerEnabled: boolean;
};

type FormattedModel = {
  llmId: number;
  llmValue: string;
  llmLabel: string;
  llmText: string;
  llmClassName: string;
  llmEnabled: boolean;
  llmIsDefault: boolean;
  llmMaxInputTokens: number;
  llmMaxOutputTokens: number;
  llmDescription: string;
};

type ProviderModels = ProviderInfo & {
  models: FormattedModel[];
};

type ModelsByProvider = Record<string, ProviderModels>;
// ? ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ^  ////////////////////////////////////////////////////////////////////////CLASS/////////////////////////////////////////////////////////////////////////////////////////

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////
const formatModel = (model: IaLlm): FormattedModel => ({
  llmId: model.id,
  llmValue: model.value,
  llmLabel: model.label,
  llmText: model.text,
  llmClassName: model.className,
  llmEnabled: model.enabled,
  llmIsDefault: model.isDefault,
  llmMaxInputTokens: model.maxInputTokens,
  llmMaxOutputTokens: model.maxOutputTokens,
  llmDescription: model.description,
});

const formatProvider = (model: IaLlm): ProviderInfo => ({
  providerLabel: model.providerRelation.label,
  providerText: model.providerRelation.text,
  providerClassName: model.providerRelation.className,
  providerEnabled: model.providerRelation.enabled,
});

const formatModels = (models: IaLlm[]): ModelsByProvider => {
  return models.reduce((acc: ModelsByProvider, model) => {
    const providerKey = model.providerRelation.value;

    if (!acc[providerKey]) {
      acc[providerKey] = {
        ...formatProvider(model),
        models: [],
      };
    }

    acc[providerKey]?.models.push(formatModel(model));
    return acc;
  }, {});
};

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

// * ////////////////////////////////////////////////////////////////////////ROUTER/////////////////////////////////////////////////////////////////////////////////////////
// & Base Models Router
export const availableModelsRouter = createTRPCRouter({
  // Récupère tous les modèles d'IA disponibles, organisés par fournisseur
  getAll: protectedProcedure.query(async ({ ctx: { db } }) => {
    // Récupérer tous les providers
    const providers = await db.iaProvider.findMany({
      select: {
        value: true,
        label: true,
        text: true,
        className: true,
        enabled: true,
      },
    });

    // Récupérer tous les modèles avec leurs providers
    const models = await db.iaLlm.findMany({
      include: {
        providerRelation: true,
      },
      orderBy: {
        provider: "asc",
      },
    });

    // Formater les modèles
    const formattedModels = formatModels(models);

    // Ajouter les providers sans modèles
    providers.forEach((provider) => {
      if (!formattedModels[provider.value]) {
        formattedModels[provider.value] = {
          providerLabel: provider.label,
          providerText: provider.text,
          providerClassName: provider.className,
          providerEnabled: provider.enabled,
          models: [],
        };
      }
    });

    return formattedModels;
  }),

  // App locale : mêmes modèles pour tous (pas de filtre par config)
  getFiltred: protectedProcedure.query(async ({ ctx: { db } }) => {
    const models = await db.iaLlm.findMany({
      include: {
        providerRelation: true,
      },
      orderBy: {
        provider: "asc",
      },
    });
    const formatted = formatModels(models);
    const providers = await db.iaProvider.findMany({
      select: {
        value: true,
        label: true,
        text: true,
        className: true,
        enabled: true,
      },
    });
    providers.forEach((p) => {
      if (!formatted[p.value]) {
        formatted[p.value] = {
          providerLabel: p.label,
          providerText: p.text,
          providerClassName: p.className,
          providerEnabled: p.enabled,
          models: [],
        };
      }
    });
    return formatted;
  }),
});
