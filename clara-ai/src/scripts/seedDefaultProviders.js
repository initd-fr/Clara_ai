/**
 * Crée les 3 providers par défaut (OpenAI, Mistral, Google) s'ils n'existent pas.
 * Idempotent : ne fait rien si un provider existe déjà.
 * Usage : node src/scripts/seedDefaultProviders.js
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULT_PROVIDERS = [
  {
    value: "openai",
    label: "OpenAI",
    text: "Raisonnement configurable, agents et workflows professionnels. Idéal pour le développement, l’analyse de documents/tableaux et les tâches multimodales (texte, audio, vision).",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    enabled: true,
  },
  {
    value: "mistral",
    label: "Mistral",
    text: "Excellent multilingue (dizaines de langues, 80+ langages). Bon rapport performance/coût, adapté au code et aux usages multilingues.",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    enabled: true,
  },
  {
    value: "google",
    label: "Google",
    text: "Multimodal (images, vidéo, PDF), long contexte et raisonnement avancé. Fort en analyse de documents longs, vision, transcription et synthèse de contenus visuels ou vidéo.",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    enabled: true,
  },
  {
    value: "anthropic",
    label: "Anthropic",
    text: "Raisonnement de pointe, long contexte (jusqu’à 1M tokens), code production-ready. Idéal pour l’analyse juridique/financière, les codebases volumineuses et les workflows agents exigeants.",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    enabled: true,
  },
];

async function main() {
  for (const provider of DEFAULT_PROVIDERS) {
    const existing = await db.iaProvider.findUnique({
      where: { value: provider.value },
    });
    if (existing) {
      console.log("✅ Provider déjà présent :", provider.value);
      continue;
    }
    await db.iaProvider.create({
      data: provider,
    });
    console.log("✅ Provider créé :", provider.value, "—", provider.label);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed providers :", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
