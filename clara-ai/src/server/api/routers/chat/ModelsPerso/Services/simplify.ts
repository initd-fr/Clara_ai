// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////import { z } from "zod";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ? ////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////
type MessageContent = string | { content: string } | BaseMessage;
// ? ////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////`

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////
export const extractContent = (response: MessageContent): string => {
  if (typeof response === "string") return response;
  if (
    typeof response === "object" &&
    "content" in response &&
    typeof response.content === "string"
  ) {
    return response.content;
  }
  return "";
};
// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

export const toolsRouter = createTRPCRouter({
  simplifyMessage: protectedProcedure
    .input(
      z.object({
        modelId: z.number(),
        optimizationType: z.enum([
          //TODO  Format
          "shorten",
          "lengthen",
          "keyPoints",
          "bulletPoints",
          "paragraph",
          //TODO  Style
          "standard",
          "formal",
          "casual",
          "professional",
          "academic",
          "expert",
          //TODO  Ton
          "simplified",
          "persuasive",
          "neutral",
          "emoji",
          "noEmoji",
          "optimistic",
          "critical",
          //TODO  Public
          "children",
          "adolescent",
          "general",
          //TODO  Réseaux sociaux
          "tweet",
          "thread",
          "linkedin",
          "story",
          "poem",
          //TODO  Mise en forme
          "toBullets",
          "toNumberedList",
          "toTable",
          "toOutline",
          "fromBullets",
          "fromTable",
          "mergeParagraphs",
          "separateIdeas",
          //TODO  Contextes avancés
          "scientificSummary",
          "executiveSummary",
          "historical",
          "debate",
          "counterArgument",
          "codeCommenter",
          "restructureLogicalFlow",
          "translateToJargon",
          "expandWithSources",
          "summarizeForPresentation",
          "questionGenerator",
        ]),
        content: z.string(),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: { modelId, optimizationType, content },
      }) => {
        try {
          const userId = session.user.id;
          const model = await db.models.findUnique({
            where: { id: modelId, userId },
          });
          if (!model) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Modèle non trouvé.",
            });
          }

          const llm = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            model: "gpt-4.1-nano-2025-04-14",
            streaming: true, // Activer le streaming
          });

          const optimizationPrompts = {
            // ──────────────── FORMAT ────────────────
            shorten: `Réduis ce texte d'environ 50 % tout en conservant l'essentiel des idées : ${content}`,
            lengthen: `Développe ce texte en ajoutant des exemples, précisions ou justifications pertinentes. Garde un style fluide : ${content}`,
            keyPoints: `Identifie les idées principales et structure-les sous forme de points clés hiérarchisés : ${content}`,
            bulletPoints: `Reformule ce texte sous forme de liste à puces claire et synthétique : ${content}`,
            paragraph: `Réorganise ce texte en paragraphes logiques avec des transitions naturelles entre les idées : ${content}`,

            // ──────────────── STYLE ────────────────
            standard: `Reformule ce texte dans un style professionnel, simple et accessible : ${content}`,
            formal: `Adopte un style formel, soutenu et conforme aux codes de communication institutionnelle : ${content}`,
            casual: `Utilise un ton naturel et familier, comme dans une conversation informelle : ${content}`,
            professional: `Adopte un ton professionnel, clair et structuré, adapté à un contexte d'entreprise : ${content}`,
            academic: `Reformule ce texte selon les standards d'un article scientifique : structure académique (titre, résumé, introduction, méthodes, résultats, discussion), vocabulaire technique, temps verbaux appropriés. Fournis un mini-article rigoureux : ${content}`,
            expert: `Reformule avec un vocabulaire spécialisé et un ton technique, destiné à un public expert du domaine : ${content}`,

            // ──────────────── TON ────────────────
            simplified: `Simplifie ce texte pour le rendre accessible à tous. Évite les termes techniques et explique les notions complexes : ${content}`,
            persuasive: `Rends ce texte plus convaincant en valorisant les arguments, structurant le message de façon persuasive : ${content}`,
            neutral: `Reformule ce texte avec un ton neutre, objectif et dénué d'opinion : ${content}`,
            optimistic: `Adopte un ton positif, engageant et motivant tout en conservant le fond du message : ${content}`,
            critical: `Ajoute un regard analytique et critique, en soulignant limites, enjeux ou controverses : ${content}`,
            emoji: `Ajoute des émojis pertinents pour dynamiser le texte sans en dénaturer le sens : ${content}`,
            noEmoji: `Supprime tous les émojis et ajuste le texte pour conserver une communication fluide : ${content}`,

            // ──────────────── PUBLIC ────────────────
            children: `Adapte ce texte pour des enfants (8–12 ans). Utilise un vocabulaire simple et des exemples concrets : ${content}`,
            adolescent: `Reformule ce texte pour un public adolescent, avec un ton dynamique, accessible et captivant : ${content}`,
            general: `Adapte ce texte pour un public non-spécialiste, en vulgarisant les concepts techniques : ${content}`,

            // ──────── FORMATS COURTS & RÉSEAUX ────────
            tweet: `Condense ce texte en un tweet percutant de 280 caractères maximum, tout en conservant l'idée principale : ${content}`,
            thread: `Divise ce texte en une série de tweets (thread), chaque tweet développant une idée cohérente : ${content}`,
            linkedin: `Transforme ce texte en publication LinkedIn professionnelle, engageante et synthétique : ${content}`,
            story: `Transforme ce texte en histoire courte captivante avec narration fluide (début, milieu, fin) : ${content}`,
            poem: `Réécris ce texte sous forme de poème en conservant son essence, avec un style lyrique ou symbolique : ${content}`,

            // ──────────────── MISE EN FORME ────────────────
            toBullets: `Transforme ce texte en une liste à puces structurée et facile à lire : ${content}`,
            toNumberedList: `Présente les idées sous forme de liste numérotée avec une logique séquentielle : ${content}`,
            toTable: `Présente les données sous forme de tableau. Crée des colonnes claires avec titres pertinents : ${content}`,
            toOutline: `Structure ce texte sous forme de plan hiérarchisé (I, II, III – A, B, C) : ${content}`,
            fromBullets: `Transforme cette liste à puces en paragraphes fluides et bien rédigés : ${content}`,
            fromTable: `Rédige une description synthétique de ce tableau en conservant les relations entre les données : ${content}`,
            mergeParagraphs: `Fusionne les paragraphes pour produire un texte plus compact et cohérent : ${content}`,
            separateIdeas: `Divise ce texte pour que chaque idée soit développée dans un paragraphe distinct : ${content}`,

            // ──────────────── CONTEXTES AVANCÉS ────────────────
            scientificSummary: `Fais une synthèse vulgarisée de ce texte scientifique tout en respectant sa rigueur méthodologique : ${content}`,
            executiveSummary: `Résume ce texte pour des décideurs (managers, directeurs) de manière stratégique et concise : ${content}`,
            historical: `Réécris ce texte dans un style littéraire inspiré des textes historiques ou classiques : ${content}`,
            debate: `Formule ce texte comme un argument pour un débat structuré, avec position claire et justification : ${content}`,
            counterArgument: `Adopte un point de vue opposé à celui du texte, et reformule-le de manière rigoureuse et argumentée : ${content}`,
            codeCommenter: `Commente ce bloc de code en anglais, ligne par ligne, pour expliquer son fonctionnement : ${content}`,
            restructureLogicalFlow: `Réorganise les idées du texte pour en améliorer la clarté, la progression logique et la lisibilité : ${content}`,
            translateToJargon: `Reformule ce texte en utilisant le jargon du domaine spécifique de ce message. Spécifie le domaine : ${content}`,
            expandWithSources: `Développe ce texte en ajoutant des sources, références ou citations académiques fiables : ${content}`,
            summarizeForPresentation: `Résume ce texte pour le présenter à l'oral (pitch, exposé, soutenance) avec des idées claires et mémorables : ${content}`,
            questionGenerator: `Génère une liste de questions pertinentes à poser à partir de ce texte, pour stimuler la réflexion : ${content}`,
          };
          const optimizationPrompt = optimizationPrompts[optimizationType];

          // Utiliser le streaming comme pour les messages standards
          const response = await llm.invoke([
            new HumanMessage(optimizationPrompt),
          ]);
          const optimizedContent = extractContent(response);

          return {
            question: content,
            answer: optimizedContent,
            type: optimizationType,
            isSimplify: true,
            streaming: true, // Indiquer que la réponse est en streaming
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("Erreur dans simplifyMessage:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erreur lors de l'optimisation du message.",
          });
        }
      },
    ),
});
