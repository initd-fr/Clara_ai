//TODO Controller pour les modèles LLM disponibles pour chaque accountType
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
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
  availableSubscriptions: Prisma.JsonValue;
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
  availableSubscriptions: string[];
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
  availableSubscriptions: Array.isArray(model.availableSubscriptions)
    ? (model.availableSubscriptions as string[])
    : [],
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

const filterModelsByUser = async (
  models: ModelsByProvider,
  userRole: string,
  userAccountType: string,
  userId: string,
  db: any,
): Promise<ModelsByProvider> => {
  // Si c'est un admin/support, accès à tout
  if (userRole === "support" || userRole === "admin") {
    return models;
  }

  // Récupérer l'abonnement actuel de l'utilisateur
  const userSubscription = await db.userSubscription.findFirst({
    where: {
      userId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      config: true,
    },
  });

  // Récupérer l'abonnement par défaut (isDefault = true)
  const defaultSubscription = await db.subscriptionConfig.findFirst({
    where: {
      isDefault: true,
    },
  });

  // Déterminer l'ID de l'abonnement à utiliser
  let subscriptionId: string | null = null;
  if (userSubscription) {
    subscriptionId = userSubscription.configId?.toString();
  } else if (defaultSubscription) {
    subscriptionId = defaultSubscription.id.toString();
  }

  // Filtrer les modèles selon la logique d'abonnement dynamique
  const result = Object.entries(models).reduce(
    (acc: ModelsByProvider, [providerKey, provider]) => {
      const filteredModels = provider.models.filter((model) => {
        // Vérifier si le modèle est accessible selon les abonnements dynamiques
        if (!Array.isArray(model.availableSubscriptions)) {
          return false;
        }

        // Si on a un ID d'abonnement, vérifier si le modèle est accessible
        if (subscriptionId) {
          const hasAccess =
            model.availableSubscriptions.includes(subscriptionId);
          return hasAccess;
        }

        // Si pas d'abonnement du tout, pas d'accès
        return false;
      });

      if (filteredModels.length > 0) {
        acc[providerKey] = {
          ...provider,
          models: filteredModels,
        };
      }
      return acc;
    },
    {},
  );

  return result;
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

  // Récupère les modèles filtrés selon le rôle et le type de compte de l'utilisateur
  getFiltred: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    const { role: userRole, accountType: userAccountType } = session.user;
    const models = await db.iaLlm.findMany({
      include: {
        providerRelation: true,
      },
      orderBy: {
        provider: "asc",
      },
    });
    const formattedModels = formatModels(models);
    return filterModelsByUser(
      formattedModels,
      userRole,
      userAccountType,
      session.user.id,
      db,
    );
  }),
});
