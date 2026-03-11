/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";
import createAnAgent, { createAnExpert } from "./Services/createService";
import { emitProgress } from "~/server/shared/progressBridge";
import { settingsManager } from "~/server/api/routers/Settings/settingsManager";
import type { Session } from "next-auth";

let _openai: OpenAI | null = null;
const getOpenAI = (): OpenAI => {
  if (!process.env.OPENAI_API_KEY)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "OPENAI_API_KEY non configurée",
    });
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

/////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

export const speedCreateRouter = createTRPCRouter({
  configureAgent: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.array(z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const providers = await ctx.db.iaProvider.findMany({
          where: {
            enabled: true,
          },
          include: {
            llms: {
              where: {
                enabled: true,
              },
            },
          },
        });

        // App locale : tous les LLM activés sont accessibles
        const providerData = providers
          .map((provider) => ({
            value: provider.value,
            label: provider.label,
            text: provider.text,
            className: provider.className,
            models: provider.llms
              .filter((llm) => llm.enabled)
              .map((llm) => ({
                llmId: llm.id,
                llmValue: llm.value,
                llmLabel: llm.label,
                llmText: llm.text,
                llmClassName: llm.className,
              })),
          }))
          .filter((provider) => provider.models.length > 0);

        // 🔥 Log détaillé des modèles disponibles pour cet utilisateur
        console.log("📋 Modèles disponibles pour l'utilisateur:");
        providerData.forEach((provider) => {
          console.log(`  - ${provider.label} (${provider.value}):`);
          provider.models.forEach((model) => {
            console.log(`    • ${model.llmValue} (${model.llmText})`);
          });
        });

        // 🔥 Sélectionner le modèle accessible à l'utilisateur pour le speed create
        let speedCreateModel: string | null = null;
        const settingDefault = await settingsManager.get<string>(
          "SpeedCreate_DefaultModel",
        );

        // Priorité 1 : paramètre Support > Paramètres (Modèle par défaut Speed Create)
        if (settingDefault && typeof settingDefault === "string") {
          const found = providerData.find((p) =>
            p.models.some((m) => m.llmValue === settingDefault),
          );
          if (found) {
            speedCreateModel = settingDefault;
            console.log(
              `✅ Using Speed Create default from settings: ${speedCreateModel}`,
            );
          }
        }

        // Priorité 2 : modèle marqué isDefault en DB
        if (!speedCreateModel) {
          for (const provider of providerData) {
            const defaultModel = provider.models.find((model) => {
              const originalProvider = providers.find(
                (p) => p.value === provider.value,
              );
              return originalProvider?.llms?.find(
                (llm) => llm.isDefault && llm.value === model.llmValue,
              );
            });
            if (defaultModel) {
              speedCreateModel = defaultModel.llmValue;
              console.log(
                `✅ Using user's accessible default model: ${speedCreateModel}`,
              );
              break;
            }
          }
        }

        // Priorité 3 : premier modèle accessible
        if (!speedCreateModel && providerData.length > 0) {
          speedCreateModel = providerData[0]?.models[0]?.llmValue || null;
          console.log(`✅ Using first accessible model: ${speedCreateModel}`);
        }

        if (!speedCreateModel) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Aucun modèle LLM configuré. Ajoutez des modèles dans Support > Models.",
          });
        }

        const content = `Tu es un expert en création d’agents IA spécialisés. Tu travailles avec rigueur, méthode et précision.

---

🎯 **TA MISSION**
Analyser la demande de l'utilisateur et créer un agent IA **parfaitement spécialisé** dans le domaine explicitement demandé.

---

🧠 **PROCESSUS STRUCTURÉ** (obligatoire) :

1. **Analyse précise de la demande**
   - Reformule en une phrase claire ce que veut l'utilisateur.
   - Identifie : 
     - Le **domaine d'expertise**
     - Le **rôle de l’agent** (ex: coach, expert, assistant, consultant, etc.)
     - Le **objectif principal** de l’utilisateur

2. **Vérifie la cohérence**
   - Le domaine détecté correspond-il exactement à celui mentionné par l’utilisateur ? Si ce n’est pas clair, **ne crée pas d’agent** : demande des précisions.

3. **Crée l'agent via createAnAgent**
   - Seulement après confirmation du domaine.
   - Utilise les règles suivantes :

---

📏 **RÈGLES D’OR**

- ✅ L’agent doit être **spécifique**, **mono-domaine**, **mono-rôle**
- ✅ Le nom de l’agent doit **décrire le domaine + fonction**
- ✅ Le prompt doit être **complet**, **sans placeholder**, **directement exploitable**
- ❌ Ne crée **jamais** un agent générique ou polyvalent
- ❌ Ne crée **jamais** un agent PDF par défaut
- ❌ Ne remplis **jamais** la fonction sans être sûr de la demande

---

📝 **FORMAT ATTENDU POUR LE PROMPT DE L’AGENT** :

> Tu es un assistant spécialisé en **[Domaine]**. Tu aides les utilisateurs avec **[Objectifs spécifiques]**. Ton rôle est de **[Rôle]**. Tu maîtrises parfaitement les concepts, outils et problématiques liés à ce domaine. Utilise tes compétences pour fournir des réponses **claires, fiables et adaptées au contexte**.

Exemple :
> Tu es un expert en droit du travail français. Tu aides les utilisateurs à comprendre les règles liées aux contrats, licenciements, obligations de l'employeur et droits des salariés. Ton rôle est de fournir des explications juridiques fiables, conformes au Code du travail.

---

🚀 **À FAIRE**
Une fois la demande comprise :
- Appelle createAnAgent avec :
   - name: un nom descriptif et spécifique
   - prompt: un prompt complet, précis, sans placeholder
   - modelName et provider: choisis les plus adaptés parmi :
     ${providerData.map((p) => `\n     - **${p.label}** (${p.value}) : ${p.models.map((m) => m.llmValue).join(", ")}`).join("")}

---

❗️**NE FAIS RIEN** si la demande est floue ou ambiguë. Pose des questions de clarification AVANT toute création.`;

        const messages: ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: content,
          } as ChatCompletionSystemMessageParam,
          ...input.context.map(
            (msg) =>
              ({
                role: msg.role,
                content: msg.content,
              }) as
                | ChatCompletionUserMessageParam
                | ChatCompletionAssistantMessageParam,
          ),
        ];

        // 🔥 Le modèle speedCreateModel est maintenant garanti d'être accessible à l'utilisateur
        console.log(
          `✅ Utilisation du modèle sélectionné: ${speedCreateModel}`,
        );

        try {
          const completion = await getOpenAI().chat.completions.create({
            model: speedCreateModel,
            messages,
            tools: [
              {
                type: "function",
                function: {
                  name: "createAnAgent",
                  description:
                    "Crée un agent IA avec les paramètres spécifiés. Utilise cette fonction dès que tu as les informations essentielles pour créer un agent fonctionnel.",
                  parameters: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Nom de l'agent",
                      },
                      prompt: {
                        type: "string",
                        description: "Prompt système détaillé pour l'agent",
                      },
                      modelName: {
                        type: "string",
                        description: "Nom du modèle à utiliser",
                      },
                      provider: {
                        type: "string",
                        description: "Fournisseur du modèle",
                      },
                    },
                    required: ["name", "prompt", "modelName", "provider"],
                  },
                },
              },
            ],
          });

          const message = completion.choices[0]?.message;
          const toolCall = message?.tool_calls?.[0];

          if (toolCall) {
            if (toolCall.function.name === "createAnAgent") {
              try {
                const taskId = `speed-create-agent-${Date.now()}`;
                emitProgress({
                  userId: ctx.session.user.id,
                  taskId,
                  type: "create",
                  step: "Création de l'agent en cours...",
                  progress: 0,
                  done: false,
                });

                const params = JSON.parse(toolCall.function.arguments);
                // Normaliser le nom de modèle: retirer un éventuel préfixe de provider (ex: "openai:")
                const normalizedModelName =
                  typeof params.modelName === "string"
                    ? params.modelName.replace(/^([a-z0-9_-]+):/i, "")
                    : params.modelName;
                const validProvider = providers.find(
                  (p) =>
                    p.value === params.provider ||
                    p.label.toLowerCase() === params.provider.toLowerCase() ||
                    p.value.toLowerCase() === params.provider.toLowerCase(),
                );

                if (!validProvider) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Provider "${params.provider}" non trouvé. Providers disponibles: ${providers.map((p) => p.value).join(", ")}`,
                  });
                }

                // Validation directe en base de données pour éviter les problèmes de cache
                const modelFromDb = await ctx.db.iaLlm.findFirst({
                  where: {
                    value: normalizedModelName,
                    provider: validProvider.value,
                    enabled: true,
                  },
                });

                if (!modelFromDb) {
                  // Fallback: chercher dans la liste en mémoire
                  const validModel = validProvider.llms.find(
                    (llm) =>
                      llm.value === normalizedModelName ||
                      llm.label.toLowerCase() ===
                        normalizedModelName.toLowerCase() ||
                      llm.value.toLowerCase() ===
                        normalizedModelName.toLowerCase(),
                  );

                  if (!validModel) {
                    throw new TRPCError({
                      code: "BAD_REQUEST",
                      message: `Modèle "${normalizedModelName}" non trouvé pour le provider "${validProvider.value}". Modèles disponibles: ${validProvider.llms.map((llm) => llm.value).join(", ")}`,
                    });
                  }
                }

                const result = await createAnAgent(
                  {
                    name: params.name,
                    prompt: params.prompt,
                    modelName: normalizedModelName,
                    isAnExpert: false,
                    provider: validProvider.value,
                    userId: ctx.session.user.id,
                    skipTaskCreation: true,
                  },
                  ctx,
                );

                if (!result) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Erreur lors de la création de l'agent",
                  });
                }

                // Vérifier si le modèle supporte les messages de type "function"
                const supportsFunctionMessages =
                  speedCreateModel.includes("gpt-4") ||
                  speedCreateModel.includes("gpt-3.5-turbo") ||
                  speedCreateModel.includes("gpt-4o");

                if (supportsFunctionMessages) {
                  // Le modèle supporte les fonctions, faire un deuxième appel pour une réponse plus naturelle
                  const messagesWithFunctionResult: ChatCompletionMessageParam[] =
                    [
                      ...messages,
                      {
                        role: "function",
                        name: toolCall.function.name,
                        content: JSON.stringify(result),
                      } as any, // Type assertion pour éviter les erreurs TypeScript
                    ];

                  try {
                    const finalCompletion =
                      await getOpenAI().chat.completions.create({
                        model: speedCreateModel,
                        messages: messagesWithFunctionResult,
                      });

                    return {
                      type: "success",
                      content:
                        finalCompletion.choices[0]?.message?.content ??
                        `Agent créé avec succès ! Votre agent "${result.name}" est maintenant prêt à l'emploi.`,
                      progress: 0,
                      taskId: ctx.session.user.id,
                      modelId: result.id,
                      taskCreated: true,
                    };
                  } catch (functionError) {
                    // Si l'appel avec fonction échoue, retourner directement le succès
                    console.warn(
                      "⚠️ Function message not supported, using direct response:",
                      functionError,
                    );
                    return {
                      type: "success",
                      content: `Agent créé avec succès ! Votre agent "${result.name}" est maintenant prêt à l'emploi.`,
                      progress: 0,
                      taskId: ctx.session.user.id,
                      modelId: result.id,
                      taskCreated: true,
                    };
                  }
                } else {
                  // Le modèle ne supporte pas les fonctions, retourner directement le succès
                  return {
                    type: "success",
                    content: `Agent créé avec succès ! Votre agent "${result.name}" est maintenant prêt à l'emploi.`,
                    progress: 0,
                    taskId: ctx.session.user.id,
                    modelId: result.id,
                    taskCreated: true,
                  };
                }
              } catch (createError) {
                console.error(
                  "Erreur lors de la création de l'agent:",
                  createError,
                );
                return {
                  type: "chat",
                  content: `Je n'ai pas pu créer l'agent à cause d'une erreur technique : ${createError instanceof Error ? createError.message : "Erreur inconnue"}. Pouvez-vous me donner plus de détails sur ce que vous voulez accomplir ? Je vais essayer de vous aider autrement.`,
                  progress: 0,
                };
              }
            }
          }

          return {
            type: "chat",
            content: message?.content ?? "",
            progress: 0,
            taskCreated: false,
          };
        } catch (openaiError) {
          console.error("Erreur OpenAI dans configureAgent:", openaiError);

          // Si c'est une erreur de modèle inexistant, essayer avec gpt-4o-mini
          if (
            openaiError instanceof Error &&
            (openaiError.message.includes("model") ||
              openaiError.message.includes("503") ||
              openaiError.message.includes("server_error"))
          ) {
            console.warn("🔄 Tentative avec gpt-4o-mini...");
            try {
              const fallbackCompletion =
                await getOpenAI().chat.completions.create({
                  model: "gpt-4o-mini",
                  messages,
                  tools: [
                    {
                      type: "function",
                      function: {
                        name: "createAnAgent",
                        description:
                          "Crée un agent IA avec les paramètres spécifiés. Utilise cette fonction dès que tu as les informations essentielles pour créer un agent fonctionnel.",
                        parameters: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "Nom de l'agent",
                            },
                            prompt: {
                              type: "string",
                              description:
                                "Prompt système détaillé pour l'agent",
                            },
                            modelName: {
                              type: "string",
                              description: "Nom du modèle à utiliser",
                            },
                            provider: {
                              type: "string",
                              description: "Fournisseur du modèle",
                            },
                          },
                          required: ["name", "prompt", "modelName", "provider"],
                        },
                      },
                    },
                  ],
                });

              const fallbackMessage = fallbackCompletion.choices[0]?.message;
              return {
                type: "chat",
                content: fallbackMessage?.content ?? "",
                progress: 0,
                taskCreated: false,
              };
            } catch (fallbackError) {
              console.error("Erreur même avec gpt-4o-mini:", fallbackError);
            }
          }

          throw openaiError; // Re-throw si ce n'est pas une erreur de modèle
        }
      } catch (error) {
        console.error("Erreur dans configureAgent:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la configuration de l'agent";

        // Messages d'erreur clairs selon le type d'erreur
        if (errorMessage.includes("OpenAI") || errorMessage.includes("API")) {
          clearMessage = "Erreur de connexion à l'API OpenAI";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour créer l'agent";
        } else if (errorMessage.includes("validation")) {
          clearMessage = "Données invalides pour la configuration de l'agent";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion au service";
        }

        // Log de l'erreur
        await ctx.db.userLogs.create({
          data: {
            userId: ctx.session.user.id,
            action: "WARNING",
            modelType: "AGENT",
            modelId: 0,
            firstName: ctx.session.user.firstName,
            lastName: ctx.session.user.lastName,
            email: ctx.session.user.email,
            description: clearMessage,
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
        });
      }
    }),

  configureExpert: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.array(z.any()),
        document: z.object({
          title: z.string(),
          content: z.string(),
          mimeType: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const providers = await ctx.db.iaProvider.findMany({
          where: {
            enabled: true,
          },
          include: {
            llms: {
              where: {
                enabled: true,
              },
            },
          },
        });

        // App locale : tous les LLM activés sont accessibles
        const providerData = providers
          .map((provider) => ({
            value: provider.value,
            label: provider.label,
            text: provider.text,
            className: provider.className,
            models: provider.llms
              .filter((llm) => llm.enabled)
              .map((llm) => ({
                llmId: llm.id,
                llmValue: llm.value,
                llmText: llm.text,
                llmClassName: llm.className,
              })),
          }))
          .filter((provider) => provider.models.length > 0);

        // Log modèles disponibles (configureExpert)
        console.log(
          "📋 Modèles disponibles pour l'utilisateur (configureExpert):",
        );
        providerData.forEach((provider) => {
          console.log(`  - ${provider.label} (${provider.value}):`);
          provider.models.forEach((model) => {
            console.log(`    • ${model.llmValue} (${model.llmText})`);
          });
        });

        // 🔥 Sélectionner le modèle accessible à l'utilisateur pour le speed create (configureExpert)
        let speedCreateModel: string | null = null;
        const settingDefaultExpert = await settingsManager.get<string>(
          "SpeedCreate_DefaultModel",
        );

        if (settingDefaultExpert && typeof settingDefaultExpert === "string") {
          const found = providerData.find((p) =>
            p.models.some((m) => m.llmValue === settingDefaultExpert),
          );
          if (found) {
            speedCreateModel = settingDefaultExpert;
            console.log(
              `✅ Using Speed Create default from settings (configureExpert): ${speedCreateModel}`,
            );
          }
        }

        if (!speedCreateModel) {
          for (const provider of providerData) {
            const defaultModel = provider.models.find((model) => {
              const originalProvider = providers.find(
                (p) => p.value === provider.value,
              );
              return originalProvider?.llms?.find(
                (llm) => llm.isDefault && llm.value === model.llmValue,
              );
            });
            if (defaultModel) {
              speedCreateModel = defaultModel.llmValue;
              console.log(
                `✅ Using user's accessible default model (configureExpert): ${speedCreateModel}`,
              );
              break;
            }
          }
        }

        if (!speedCreateModel && providerData.length > 0) {
          speedCreateModel = providerData[0]?.models[0]?.llmValue || null;
          console.log(
            `✅ Using first accessible model (configureExpert): ${speedCreateModel}`,
          );
        }

        if (!speedCreateModel) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Aucun modèle LLM configuré. Ajoutez des modèles dans Support > Models.",
          });
        }

        const content = `Tu es un expert en création d'experts IA spécialisés à partir de documents techniques, juridiques, scientifiques ou métiers.

---

🎯 **OBJECTIF**
Analyser le **document fourni** et la **demande de l'utilisateur** afin de créer un **expert IA spécialisé**, parfaitement adapté au **domaine du document** et aux **besoins exprimés**.

---

🧠 **PROCÉDURE STRICTE**

1. **Analyse du document**
   - Quel est le **domaine principal** du contenu ?
   - S’agit-il de droit, finance, médecine, ingénierie, RH, marketing, etc. ?
   - Le contenu est-il : explicatif, procédural, réglementaire, stratégique, etc. ?

2. **Analyse de la demande de l'utilisateur**
   - Quel est l’**objectif concret** visé avec ce document ?
   - L’utilisateur veut-il un **coach, tuteur, expert, conseiller, analyste** ?

3. **Validation croisée**
   - Le rôle proposé est-il cohérent avec le **type de contenu** du document ?
   - Le domaine du document est-il **univoque** ?
   - Si des éléments sont ambigus, **ne crée pas l’expert** → demande des clarifications à l’utilisateur.

4. **Création finale**
   - Appelle createAnExpert avec :
     - un **nom spécifique**
     - un **prompt finalisé, sans placeholder**
     - un modèle adapté

---

📏 **RÈGLES D’OR**

- ✅ **Un seul domaine** par expert
- ✅ Le nom doit **refléter clairement la spécialisation**
- ✅ Le prompt doit être **cohérent avec le document ET la demande**
- ✅ Pas de généralité, pas de fonction floue
- ❌ Ne jamais supposer le domaine si le document ne le montre pas clairement
- ❌ Ne jamais générer un expert polyvalent
- ❌ Ne pas créer un expert PDF sauf si demandé explicitement

---

📝 **STRUCTURE ATTENDUE DU PROMPT DE L’EXPERT**

> Tu es un expert spécialisé en **[Domaine spécifique]**. Ton rôle est d’**[accompagner, expliquer, conseiller, etc.]** en utilisant les informations du document. Tu aides les utilisateurs à **[objectif précis]** en leur fournissant des réponses **fiables, claires et adaptées**. Tu maîtrises les concepts, la terminologie et les bonnes pratiques de ce domaine.

**EXEMPLE CORRECT :**
> Tu es un expert en fiscalité des entreprises françaises. Tu aides les utilisateurs à comprendre les obligations fiscales, la TVA, l’impôt sur les sociétés, et à optimiser leur fiscalité tout en respectant la législation. Tu fournis des conseils fiables basés sur les textes officiels et pratiques comptables reconnues.

---

🚀 **FINALISATION**

Une fois les analyses terminées :
- Appelle createAnExpert avec :
   - name: un nom clair et spécialisé
   - prompt: complet, précis, sans variable ou placeholder
   - provider et modelName: choisis les plus adaptés parmi :
     ${providerData.map((p) => `\n     - **${p.label}** (${p.value}) : ${p.models.map((m) => m.llmValue).join(", ")}`).join("")}

---

⛔️ **SI LE DOMAINE OU LE RÔLE NE SONT PAS CLAIRS**
→ Ne crée PAS d’expert. Pose des questions à l’utilisateur pour clarifier le besoin.`;

        const messages: ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: content,
          } as ChatCompletionSystemMessageParam,
          ...input.context.map(
            (msg) =>
              ({
                role: msg.role,
                content: msg.content,
              }) as
                | ChatCompletionUserMessageParam
                | ChatCompletionAssistantMessageParam,
          ),
          {
            role: "system",
            content: `DOCUMENT: ${input.document.title} - ${input.document.content.substring(0, 1000)}...`,
          } as ChatCompletionSystemMessageParam,
        ];

        // 🔥 Le modèle speedCreateModel est maintenant garanti d'être accessible à l'utilisateur
        console.log(
          `✅ Utilisation du modèle sélectionné: ${speedCreateModel}`,
        );

        try {
          const completion = await getOpenAI().chat.completions.create({
            model: speedCreateModel,
            messages,
            tools: [
              {
                type: "function",
                function: {
                  name: "createAnExpert",
                  description:
                    "Crée un expert IA avec les paramètres spécifiés et le document fourni. Utilise cette fonction dès que tu as les informations essentielles pour créer un expert fonctionnel.",
                  parameters: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Nom de l'expert",
                      },
                      prompt: {
                        type: "string",
                        description: "Prompt système détaillé pour l'expert",
                      },
                      modelName: {
                        type: "string",
                        description: "Nom du modèle à utiliser",
                      },
                      provider: {
                        type: "string",
                        description: "Fournisseur du modèle",
                      },
                    },
                    required: ["name", "prompt", "modelName", "provider"],
                  },
                },
              },
            ],
          });

          const message = completion.choices[0]?.message;
          const toolCall = message?.tool_calls?.[0];

          if (toolCall) {
            console.log("🎯 Tool call détecté:", toolCall.function.name);
            if (toolCall.function.name === "createAnExpert") {
              try {
                console.log("🎯 Création de la tâche pour l'expert...");
                const taskId = `speed-create-expert-${Date.now()}`;
                emitProgress({
                  userId: ctx.session.user.id,
                  taskId,
                  type: "create",
                  step: "Création de l'expert en cours...",
                  progress: 0,
                  done: false,
                });

                const params = JSON.parse(toolCall.function.arguments);
                // Normaliser le nom de modèle: retirer un éventuel préfixe de provider (ex: "openai:")
                const normalizedModelName =
                  typeof params.modelName === "string"
                    ? params.modelName.replace(/^([a-z0-9_-]+):/i, "")
                    : params.modelName;

                const validProvider = providers.find(
                  (p) =>
                    p.value === params.provider ||
                    p.label.toLowerCase() === params.provider.toLowerCase() ||
                    p.value.toLowerCase() === params.provider.toLowerCase(),
                );

                if (!validProvider) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Provider "${params.provider}" non trouvé. Providers disponibles: ${providers.map((p) => p.value).join(", ")}`,
                  });
                }

                // Validation directe en base de données pour éviter les problèmes de cache
                const modelFromDb = await ctx.db.iaLlm.findFirst({
                  where: {
                    value: normalizedModelName,
                    provider: validProvider.value,
                    enabled: true,
                  },
                });

                if (!modelFromDb) {
                  // Fallback: chercher dans la liste en mémoire
                  const validModel = validProvider.llms.find(
                    (llm) =>
                      llm.value === normalizedModelName ||
                      llm.label.toLowerCase() ===
                        normalizedModelName.toLowerCase() ||
                      llm.value.toLowerCase() ===
                        normalizedModelName.toLowerCase(),
                  );

                  if (!validModel) {
                    throw new TRPCError({
                      code: "BAD_REQUEST",
                      message: `Modèle "${normalizedModelName}" non trouvé pour le provider "${validProvider.value}". Modèles disponibles: ${validProvider.llms.map((llm) => llm.value).join(", ")}`,
                    });
                  }
                }

                const result = await createAnExpert(
                  {
                    name: params.name,
                    prompt: params.prompt,
                    modelName: normalizedModelName,
                    isAnExpert: true,
                    provider: validProvider.value,
                    userId: ctx.session.user.id,
                    files: [
                      {
                        name: input.document.title,
                        content: input.document.content,
                        size: input.document.content.length,
                      },
                    ],
                    skipTaskCreation: true,
                  },
                  ctx,
                );

                if (!result) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Erreur lors de la création de l'expert",
                  });
                }

                // Vérifier si le modèle supporte les messages de type "function"
                const supportsFunctionMessages =
                  speedCreateModel.includes("gpt-4") ||
                  speedCreateModel.includes("gpt-3.5-turbo") ||
                  speedCreateModel.includes("gpt-4o");

                if (supportsFunctionMessages) {
                  // Le modèle supporte les fonctions, faire un deuxième appel pour une réponse plus naturelle
                  const messagesWithFunctionResult: ChatCompletionMessageParam[] =
                    [
                      ...messages,
                      {
                        role: "function",
                        name: toolCall.function.name,
                        content: JSON.stringify(result),
                      } as any, // Type assertion pour éviter les erreurs TypeScript
                    ];

                  try {
                    const finalCompletion =
                      await getOpenAI().chat.completions.create({
                        model: speedCreateModel,
                        messages: messagesWithFunctionResult,
                      });

                    console.log(
                      "🎯 configureExpert - tool_call réussi, finalCompletion:",
                      finalCompletion.choices[0]?.message,
                    );
                    return {
                      type: "success",
                      content:
                        finalCompletion.choices[0]?.message?.content ??
                        `Expert créé avec succès ! Votre expert est maintenant prêt à l'emploi.`,
                      progress: 0,
                      taskId: ctx.session.user.id,
                      modelId: result.modelId,
                    };
                  } catch (functionError) {
                    // Si l'appel avec fonction échoue, retourner directement le succès
                    console.warn(
                      "⚠️ Function message not supported, using direct response:",
                      functionError,
                    );
                    return {
                      type: "success",
                      content: `Expert créé avec succès ! Votre expert est maintenant prêt à l'emploi.`,
                      progress: 0,
                      taskId: ctx.session.user.id,
                      modelId: result.modelId,
                    };
                  }
                } else {
                  // Le modèle ne supporte pas les fonctions, retourner directement le succès
                  console.log(
                    "🎯 configureExpert - tool_call réussi, expert créé:",
                    result,
                  );
                  return {
                    type: "success",
                    content: `Expert créé avec succès ! Votre expert est maintenant prêt à l'emploi.`,
                    progress: 0,
                    taskId: ctx.session.user.id,
                    modelId: result.modelId,
                  };
                }
              } catch (createError) {
                console.error(
                  "Erreur lors de la création de l'expert:",
                  createError,
                );
                return {
                  type: "chat",
                  content: `Je n'ai pas pu créer l'expert à cause d'une erreur technique : ${createError instanceof Error ? createError.message : "Erreur inconnue"}. Pouvez-vous me donner plus de détails sur ce que vous voulez accomplir ? Je vais essayer de vous aider autrement.`,
                  progress: 0,
                };
              }
            }
          }

          return {
            type: "chat",
            content: message?.content ?? "",
            progress: 0,
          };
        } catch (openaiError) {
          console.error("Erreur OpenAI dans configureExpert:", openaiError);

          // Si c'est une erreur de modèle inexistant, essayer avec gpt-4o-mini
          if (
            openaiError instanceof Error &&
            (openaiError.message.includes("model") ||
              openaiError.message.includes("503") ||
              openaiError.message.includes("server_error"))
          ) {
            console.warn("🔄 Tentative avec gpt-4o-mini...");
            try {
              const fallbackCompletion =
                await getOpenAI().chat.completions.create({
                  model: "gpt-4o-mini",
                  messages,
                  tools: [
                    {
                      type: "function",
                      function: {
                        name: "createAnExpert",
                        description:
                          "Crée un expert IA avec les paramètres spécifiés et le document fourni. Utilise cette fonction dès que tu as les informations essentielles pour créer un expert fonctionnel.",
                        parameters: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "Nom de l'expert",
                            },
                            prompt: {
                              type: "string",
                              description:
                                "Prompt système détaillé pour l'expert",
                            },
                            modelName: {
                              type: "string",
                              description: "Nom du modèle à utiliser",
                            },
                            provider: {
                              type: "string",
                              description: "Fournisseur du modèle",
                            },
                          },
                          required: ["name", "prompt", "modelName", "provider"],
                        },
                      },
                    },
                  ],
                });

              const fallbackMessage = fallbackCompletion.choices[0]?.message;
              return {
                type: "chat",
                content: fallbackMessage?.content ?? "",
                progress: 0,
              };
            } catch (fallbackError) {
              console.error("Erreur même avec gpt-4o-mini:", fallbackError);
            }
          }

          throw openaiError; // Re-throw si ce n'est pas une erreur de modèle
        }
      } catch (error) {
        console.error("Erreur dans configureExpert:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        let clearMessage = "Erreur lors de la configuration de l'expert";

        // Messages d'erreur clairs selon le type d'erreur
        if (errorMessage.includes("OpenAI") || errorMessage.includes("API")) {
          clearMessage = "Erreur de connexion à l'API OpenAI";
        } else if (
          errorMessage.includes("MinIO") ||
          errorMessage.includes("bucket")
        ) {
          clearMessage =
            "Erreur de connexion à MinIO - Impossible de traiter le document";
        } else if (
          errorMessage.includes("PDF") ||
          errorMessage.includes("fichier")
        ) {
          clearMessage = "Erreur lors du traitement du document PDF";
        } else if (errorMessage.includes("embedding")) {
          clearMessage = "Erreur lors de la création des embeddings";
        } else if (errorMessage.includes("permission")) {
          clearMessage = "Permissions insuffisantes pour créer l'expert";
        } else if (
          errorMessage.includes("storage") ||
          errorMessage.includes("limite")
        ) {
          clearMessage = "Limite de stockage dépassée";
        } else if (errorMessage.includes("connection")) {
          clearMessage = "Erreur de connexion au service";
        }

        // Log de l'erreur
        await ctx.db.userLogs.create({
          data: {
            userId: ctx.session.user.id,
            action: "WARNING",
            modelType: "EXPERT",
            modelId: 0,
            firstName: ctx.session.user.firstName,
            lastName: ctx.session.user.lastName,
            email: ctx.session.user.email,
            description: clearMessage,
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: clearMessage,
        });
      }
    }),

  grantStoreModelTrialAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        modelId: z.number(),
        accessType: z.enum(["trial", "staff"]),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const { userId, modelId, accessType, expiresAt } = input;

      const sessionUser =
        typeof session === "object" && session !== null && "user" in session
          ? (session as Session).user
          : undefined;

      if (!sessionUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      if (sessionUser.role !== "admin" && sessionUser.role !== "support") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'avez pas les droits pour accorder des accès de test",
        });
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      const storeModel = await db.storeModel.findUnique({
        where: { id: modelId },
      });

      if (!storeModel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modèle store non trouvé",
        });
      }

      const existingAccess = await db.storeAccess.findFirst({
        where: {
          userId,
          modelId,
        },
      });

      if (existingAccess) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'utilisateur a déjà un accès à ce modèle",
        });
      }

      await db.storeAccess.create({
        data: {
          userId,
          modelId,
          accessType,
          expiresAt,
        },
      });

      await db.userLogs.create({
        data: {
          userId,
          action: "GRANT_STORE_ACCESS",
          description: `Accès ${accessType} accordé au modèle "${storeModel.name}" par ${sessionUser.role} (${sessionUser.firstName} ${sessionUser.lastName})`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });

      return {
        message: "Accès accordé avec succès",
        accessType,
        expiresAt,
      };
    }),

  revokeStoreModelAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        modelId: z.number(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const { userId, modelId } = input;

      const sessionUser =
        typeof session === "object" && session !== null && "user" in session
          ? (session as Session).user
          : undefined;

      if (!sessionUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      if (sessionUser.role !== "admin" && sessionUser.role !== "support") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'avez pas les droits pour révoquer des accès",
        });
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      const storeModel = await db.storeModel.findUnique({
        where: { id: modelId },
      });

      if (!storeModel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modèle store non trouvé",
        });
      }

      const existingAccess = await db.storeAccess.findFirst({
        where: {
          userId,
          modelId,
        },
      });

      if (!existingAccess) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun accès trouvé pour cet utilisateur et ce modèle",
        });
      }

      await db.storeAccess.delete({
        where: {
          id: existingAccess.id,
        },
      });

      await db.userLogs.create({
        data: {
          userId,
          action: "REVOKE_STORE_ACCESS",
          description: `Accès révoqué au modèle "${storeModel.name}" par ${sessionUser.role} (${sessionUser.firstName} ${sessionUser.lastName})`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });

      return {
        message: "Accès révoqué avec succès",
      };
    }),
});
