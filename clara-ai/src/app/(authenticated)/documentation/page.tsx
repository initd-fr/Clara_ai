"use client";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useMemo } from "react";
import {
  Brain,
  Sparkles,
  Zap,
  Cpu,
  EllipsisVertical,
  FileText,
  Upload,
  MoreVertical,
  MessageCircleOff,
  Settings,
  Server,
  Target,
} from "lucide-react";
import Image from "next/image";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

export default function DocumentationPage() {
  // ^ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const sections = useMemo(
    () => [
      { id: "introduction", title: "" },
      { id: "accounts", title: "" },
      { id: "model_creation", title: "" },
      { id: "models", title: "" },
      { id: "files", title: "" },
      { id: "best_practices", title: "" },
      { id: "support_admin", title: "" },
      { id: "support", title: "" },
    ],
    [],
  );
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="flex min-h-screen">
      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className="mb-16 scroll-mt-8 sm:mb-20 lg:mb-24"
            >
              <div className="mb-6 text-center sm:mb-8">
                <h3 className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text px-4 text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
                  {getSectionTitle(section.id)}
                </h3>
              </div>
              <div className="prose-sm sm:prose-base lg:prose-lg  prose max-w-none text-base-content/80">
                {getContent(section.id)}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
    /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}

const Separator = () => (
  <div className="my-12 flex items-center justify-center">
    <div className="h-px flex-1 bg-gradient-to-r from-base-300/0 via-base-300 to-base-300/0"></div>
    <span className="mx-4 text-lg font-semibold text-base-content/30">
      • • •
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-base-300/0 via-base-300 to-base-300/0"></div>
  </div>
);

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

function getSectionTitle(id: string) {
  switch (id) {
    case "introduction":
      return "🚀 Découvrir Clara AI";
    case "accounts":
      return "👥 	Types de Modèles IA dans Clara";
    case "model_creation":
      return "🛠️ Créer un modèle ou utiliser un modèle Clara";
    case "models":
      return "🤖 Nos Modèles & Fournisseurs";
    case "files":
      return "📎 Gestion des Fichiers";
    case "roadmap":
      return "🔬 Roadmap Clara AI";
    case "best_practices":
      return "💡 Bonnes Pratiques";
    case "support_admin":
      return "⚙️ Support & Paramètres (admin)";
    case "support":
      return "🤝 Support & Assistance";
    default:
      return "";
  }
}

function getContent(id: string) {
  switch (id) {
    case "introduction":
      return (
        <>
          <p className="text-xl font-normal">
            Clara AI est une plateforme conversationnelle hybride pensée pour
            répondre aux exigences du monde professionnel. Elle combine la
            puissance des modèles de langage les plus avancés avec des
            mécanismes de contrôle, de contextualisation et de spécialisation
            inédits.
          </p>
          <br />
          <p className="text-xl font-normal">
            Son objectif est clair : réduire les biais cognitifs des IA
            traditionnelles, limiter les réponses approximatives, et fournir une
            information précise, sourcée et adaptée à chaque contexte métier.
          </p>
          <br />
          <p className="text-xl font-normal">
            Clara repose sur deux approches complémentaires. La première propose
            une interface permettant à chaque utilisateur de créer ses propres
            assistants IA en utilisant le modèle d’intelligence artificielle de
            son choix. La seconde adopte une approche experte fondée sur le RAG
            (Retrieval Augmented Generation) : l’IA s’appuie sur vos documents
            et votre base de connaissances pour rechercher l’information
            pertinente et formuler des réponses contextualisées, agissant ainsi
            comme un expert de votre domaine sans nécessiter d’entraînement
            spécifique du modèle.
          </p>
          <br />
          <p className="text-xl font-normal">
            Grâce à une interface fluide, des outils puissants et une
            architecture hybride, Clara AI s&apos;adapte aussi bien aux besoins
            des novices qu&apos;aux exigences des experts.
          </p>
          <p className="text-xl font-normal">
            En déploiement local, l&apos;application fonctionne sans abonnement
            ni limite : vous disposez de tous les modèles et fournisseurs
            configurés a l&apos;installation.
          </p>
          <Separator />
        </>
      );

    case "accounts":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              Dans Clara AI, vous interagissez avec différentes formes
              d&apos;intelligence artificielle, conçues pour s&apos;adapter à
              vos usages de la conversation rapide à l&apos;analyse métier
              approfondie.
            </p>

            <div className="mt-8 space-y-8">
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="flex-shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-3 shadow-md ring-1 ring-emerald-500/20 sm:p-4">
                    <Sparkles className="h-8 w-8 text-emerald-500/70 sm:h-12 sm:w-12" />
                  </div>
                  <div className="flex-1">
                    <h5 className="mb-2 text-lg font-semibold text-emerald-500 sm:text-xl">
                      Agents
                    </h5>
                    <p className="text-base font-normal sm:text-xl">
                      IA conversationnelles polyvalentes, rapides à déployer.
                      Parfaites pour l&apos;assistance quotidienne, la
                      rédaction, ou la résolution de tâches simples sans
                      contextualisation poussée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="flex-shrink-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 p-3 shadow-md ring-1 ring-violet-500/20 sm:p-4">
                    <Brain className="h-8 w-8 text-violet-500/70 sm:h-12 sm:w-12" />
                  </div>
                  <div className="flex-1">
                    <h5 className="mb-2 text-lg font-semibold text-violet-500 sm:text-xl">
                      Experts
                    </h5>
                    <p className="text-base font-normal sm:text-xl">
                      Modèles IA hybrides alimentés par vos documents. Ils
                      apprennent de votre contenu, s&apos;adaptent à vos cas
                      d&apos;usage, et deviennent progressivement des
                      spécialistes dans leur domaine.
                      <br />
                      <br />
                      Idéal pour les métiers qui exigent contexte, précision et
                      personnalisation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Separator />
        </>
      );

    case "model_creation":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              Dans Clara, vous avez deux approches pour exploiter la puissance
              des modèles IA :
              <br />
              <br />
              • Soit vous utilisez un agent classique ( ChatGPT, Claude, etc.)
              <br />• Soit vous créez un agent ou expert personnalisé et
              specalisé dans votre domaine grace a vos documents.
            </p>

            {/* Création Rapide */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 p-4 shadow-md ring-1 ring-yellow-500/20">
                  <Zap className="h-12 w-12 text-yellow-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-yellow-500">
                    Création Rapide
                  </h4>
                  <p>
                    Recommandée si vous ne savez pas par où commencer. Clara
                    vous pose quelques questions, puis :
                  </p>
                  <ul className="ml-6 mt-4 list-disc space-y-2">
                    <li>
                      Sélectionne le meilleur fournisseur et modèle IA selon
                      votre objectif
                    </li>
                    <li>Génère un prompt optimisé automatiquement</li>
                    <li>Adapte les paramètres (température, contexte)</li>
                    <li>
                      Et crée votre modèle clé-en-main, prêt à l&apos;usage
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Création Avancée */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 shadow-md ring-1 ring-blue-500/20">
                  <Cpu className="h-12 w-12 text-blue-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-blue-500">
                    Création Avancée
                  </h4>
                  <p>
                    Idéale pour les utilisateurs expérimentés. Vous configurez
                    chaque paramètre vous-même :
                  </p>
                  <ul className="ml-6 mt-4 list-disc space-y-2">
                    <li>Nom du modèle</li>
                    <li>Prompt personnalisé</li>
                    <li>Modèle IA et fournisseur</li>
                    <li>Température, contexte et options avancées</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xl font-normal">
            Clara vous permet de passer d&apos;un besoin à un modèle
            opérationnel en quelques clics, que vous soyez expert en IA ou
            simplement à la recherche d&apos;un assistant intelligent fiable.
          </p>

          <Separator />
        </>
      );
    case "models":
      return (
        <>
          <div className="space-y-12">
            {/* OpenAI */}
            <p className="text-xl font-normal">
              Clara repose sur une architecture multi-agents hybride, combinant
              des modèles de langage issus des meilleurs fournisseurs avec des
              outils permettant de renforcer la précision, la cohérence et
              l&apos;utilité des réponses comme les recherches vectorielles, les
              recherches web, les recherches de documents, etc.
            </p>
            <p className="text-xl font-normal">
              Cette approche hybride nous permet de renforcer la précision, la
              cohérence et l&apos;utilité des réponses.
            </p>
            <p className="text-xl font-normal">
              Nos fournisseurs ont été rigoureusement sélectionnés selon des
              critères techniques stricts, mais aussi éthiques : performance,
              stabilité, documentation, respect de la confidentialité et
              conformité aux normes de sécurité.
              <br /> <br /> Aucune donnée utilisateur n&apos;est utilisée à des
              fins commerciales, revendues à des tiers ou détournée si vous avez
              respecter les recomandations d&apos;installation.
              <br /> <br /> Tout ce qui est stocké ou traité dans Clara reste
              exclusivement privé et contrôlé.
            </p>
            <h5 className="text-xl font-normal">
              Voici les fournisseurs disponibles sur la code base actuelle de
              Clara AI :
            </h5>
            <p className="text-xl font-normal">
              Libre a vous de choisir les fournisseurs que vous souhaitez
              utiliser ou d&apos;ajouter la prise en charge de nouveaux
              fournisseurs dans le code source de Clara AI.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {/* OpenAI */}
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-3 shadow-md ring-1 ring-emerald-500/20 sm:p-4">
                    <Image
                      width={48}
                      height={48}
                      src="/icons/openai-svgrepo-com.svg"
                      alt="OpenAI"
                      className="h-8 w-8 sm:h-12 sm:w-12"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(142deg) brightness(95%) contrast(101%)",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-center sm:mt-3">
                  <h6 className="text-sm font-semibold text-emerald-500 sm:text-base">
                    OpenAI
                  </h6>
                </div>
              </div>

              {/* Anthropic */}
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-3 shadow-md ring-1 ring-orange-500/20 sm:p-4">
                    <Image
                      width={48}
                      height={48}
                      src="/icons/Symbol.svg"
                      alt="Anthropic"
                      className="h-8 w-8 sm:h-12 sm:w-12"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(332deg) brightness(101%) contrast(86%)",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-center sm:mt-3">
                  <h6 className="text-sm font-semibold text-orange-500 sm:text-base">
                    Anthropic
                  </h6>
                </div>
              </div>

              {/* Mistral */}
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-3 shadow-md ring-1 ring-orange-500/20 sm:p-4">
                    <Image
                      width={48}
                      height={48}
                      src="/icons/mistral-ai-icon.svg"
                      alt="Mistral"
                      className="h-8 w-8 sm:h-12 sm:w-12"
                    />
                  </div>
                </div>
                <div className="mt-2 text-center sm:mt-3">
                  <h6 className="text-sm font-semibold text-orange-500 sm:text-base">
                    Mistral
                  </h6>
                </div>
              </div>

              {/* Google */}
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-4">
                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-3 shadow-md ring-1 ring-blue-500/20 sm:p-4">
                    <Image
                      width={48}
                      height={48}
                      src="/icons/google.svg"
                      alt="Google"
                      className="h-8 w-8 sm:h-12 sm:w-12"
                    />
                  </div>
                </div>
                <div className="mt-2 text-center sm:mt-3">
                  <h6 className="text-sm font-semibold text-blue-500 sm:text-base">
                    Google
                  </h6>
                </div>
              </div>
            </div>
          </div>
          <Separator />
        </>
      );

    case "files":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              Clara gère deux types de documents selon votre usage :
            </p>

            {/* Documents d'apprentissage */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 shadow-md ring-1 ring-green-500/20">
                  <FileText className="h-12 w-12 text-green-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-green-500">
                    Documents d&apos;apprentissage
                  </h4>
                  <p>
                    Utilisés pour enrichir un modèle personnalisé de type
                    expert.
                  </p>
                  <p className="mt-4">
                    Pour créer un expert, cliquez sur le bouton
                    &quot;Créer&quot;, sélectionnez &quot;Expert&quot; puis
                    ajoutez au moins un document PDF lors de la configuration.
                    <br />
                    <br />
                    Une fois le modèle créé, vous pouvez ajouter ou mettre à
                    jour sa base documentaire à tout moment :
                    <ul className="ml-6 mt-2 list-disc space-y-2">
                      <li>
                        Cliquez sur
                        <span className="inline-flex items-center">
                          <EllipsisVertical className="mx-1 h-4 w-4" />
                        </span>{" "}
                        puis sur &quot;Modifier&quot;
                      </li>
                      <li>
                        Ouvrez l&apos;onglet &quot;Base de connaissances&quot;
                      </li>
                      <li>Glissez-déposez ou sélectionnez votre fichier PDF</li>
                      <li>
                        Une barre de progression s&apos;affichera ; la fenêtre
                        se fermera automatiquement à la fin du chargement
                      </li>
                    </ul>
                  </p>
                </div>
              </div>
            </div>

            {/* Documents temporaires */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 shadow-md ring-1 ring-blue-500/20">
                  <Upload className="h-12 w-12 text-blue-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-blue-500">
                    Documents temporaires
                  </h4>
                  <p>
                    Utiles pour poser une question ponctuelle à Clara sans
                    stocker de données.
                    <br />
                    <br />
                    Ces documents sont analysés pendant la session de chat
                    uniquement, puis automatiquement oubliés.
                  </p>
                  <p className="mt-4">📂 Formats acceptés :</p>
                  <ul className="ml-6 mt-4 list-disc space-y-2">
                    <li>PDF (.pdf)</li>
                    <li>TXT (.txt)</li>
                    <li>CSV (.csv)</li>
                    <li>DOCX (.docx)</li>
                    <li>XLSX (.xlsx)</li>
                    <li>RTF (.rtf)</li>
                    <li>JPG / JPEG (.jpg, .jpeg)</li>
                    <li>PNG (.png)</li>
                    <li>GIF (.gif)</li>
                    <li>WEBP (.webp)</li>
                  </ul>
                  <p className="mt-5 text-base font-normal">
                    Les fichiers déposés dans l&apos;input de chat sont utilisés
                    uniquement pour la réponse en cours.
                    <br />
                    <br />
                    Ils ne sont jamais mémorisés par les modèles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />
        </>
      );

    case "best_practices":
      return (
        <>
          <div className="space-y-8">
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 backdrop-blur-xl">
              <h4 className="mb-4 text-xl font-semibold text-primary">
                Optimiser vos interactions
              </h4>
              <ul className="ml-6 list-disc space-y-4">
                <li>
                  <strong>Soignez vos prompts</strong>
                  <p className="mt-1 text-sm text-base-content/70">
                    Une consigne claire = une réponse précise.
                  </p>
                </li>
                <li>
                  <strong>Structurez vos documents</strong>
                  <p className="mt-1 text-sm text-base-content/70">
                    Que ce soit pour les document d&apos;apprentissage ou pour
                    les document temporaire veillez a ce qu&apos;ils soient bien
                    structurer pour une meilleure compréhension.
                  </p>
                </li>
                <li>
                  <strong>Ajoutez des documents </strong>
                  <p className="mt-1 text-sm text-base-content/70">
                    Veillez a ajouter assez de documents pour que votre expert
                    puisse apprendre votre domaine plus les docuemnts sonts de
                    bonne qualité et nombreux plus vous ajoutez de documents
                    plus votre expert sera performant.
                  </p>
                </li>
                <li>
                  <strong>Soyez spécifique</strong>
                  <p className="mt-1 text-sm text-base-content/70">
                    Plus vos questions sont précises, plus les réponses seront
                    pertinentes.
                  </p>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 backdrop-blur-xl sm:p-6">
              <h4 className="mb-4 text-lg font-semibold text-primary sm:text-xl">
                🎯 Utiliser le Prompt Engineering
              </h4>
              <p className="mb-6 text-sm text-base-content/70 sm:text-base">
                Améliorer vos interactions avec Clara passe par une bonne
                formulation de vos consignes.
                <br /> <br />
                Chaque fournisseur IA a ses préférences. Voici les meilleures
                pratiques adaptées à chacun.
              </p>

              <div className="space-y-4 sm:space-y-6">
                {/* OpenAI */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-emerald-500 sm:text-lg">
                    🤖 OpenAI (GPT‑4, GPT‑3.5)
                  </h5>
                  <p className="mb-3 text-sm text-base-content/70">
                    <strong>Préférence :</strong> Prompts concis, structurés, et
                    directs.
                  </p>
                  <div className="mb-3 rounded-lg bg-emerald-500/10 p-3 sm:p-4">
                    <p className="text-sm font-medium text-emerald-600">
                      <strong>Technique optimale :</strong>
                    </p>
                    <p className="mt-2 text-sm text-emerald-700">
                      &quot;Tu es un expert [domaine]. Analyse le texte suivant
                      en 3 bullet points, en étant précis, factuel et
                      synthétique.&quot;
                    </p>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Utilisez la formulation &quot;Let&apos;s think step by
                    step&quot; pour améliorer la qualité du raisonnement.
                  </p>
                </div>

                {/* Anthropic */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    🧠 Anthropic (Claude 3)
                  </h5>
                  <p className="mb-3 text-sm text-base-content/70">
                    <strong>Préférence :</strong> Prompts bien organisés avec
                    rôle clair, objectifs définis et sections explicites.
                  </p>
                  <div className="mb-3 rounded-lg bg-orange-500/10 p-3 sm:p-4">
                    <p className="text-sm font-medium text-orange-600">
                      <strong>Technique optimale :</strong>
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-orange-700">
                      <p>
                        &lt;role&gt;Tu es un expert en stratégie
                        digitale&lt;/role&gt;
                      </p>
                      <p>
                        &lt;objectif&gt;Identifie les erreurs dans ce plan
                        marketing&lt;/objectif&gt;
                      </p>
                      <p>
                        &lt;context&gt;Document basé sur une PME
                        e-commerce&lt;/context&gt;
                      </p>
                      <p>
                        &lt;format&gt;Réponds sous forme de tableau
                        comparatif&lt;/format&gt;
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Claude est très sensible au ton, privilégie un style clair
                    et neutre.
                  </p>
                </div>

                {/* Mistral */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    📦 Mistral (Small / Large)
                  </h5>
                  <p className="mb-3 text-sm text-base-content/70">
                    <strong>Préférence :</strong> Instructions structurées,
                    syntaxe sobre, prompts courts mais ciblés.
                  </p>
                  <div className="mb-3 rounded-lg bg-orange-500/10 p-3 sm:p-4">
                    <p className="text-sm font-medium text-orange-600">
                      <strong>Technique optimale :</strong>
                    </p>
                    <p className="mt-2 text-sm text-orange-700">
                      &quot;Résumé synthétique (max 5 lignes) du texte suivant :
                      [insérer le texte ici]. Adopte un ton neutre et
                      informatif.&quot;
                    </p>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Mistral répond bien aux formats &quot;bullet points&quot; ou
                    &quot;titre : contenu&quot;. Évite les prompts trop
                    narratifs.
                  </p>
                </div>

                {/* Google */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-blue-500 sm:text-lg">
                    🧬 Google (Gemini / PaLM)
                  </h5>
                  <p className="mb-3 text-sm text-base-content/70">
                    <strong>Préférence :</strong> Prompts avec contexte
                    détaillé, style conversationnel, exemples utiles.
                  </p>
                  <div className="mb-3 rounded-lg bg-blue-500/10 p-3 sm:p-4">
                    <p className="text-sm font-medium text-blue-600">
                      <strong>Technique optimale :</strong>
                    </p>
                    <p className="mt-2 text-sm text-blue-700">
                      &quot;Tu es professeur de biologie. Explique ce concept de
                      manière simple, comme à un lycéen. Utilise un exemple
                      visuel si possible.&quot;
                    </p>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Gemini réagit très bien aux prompts pédagogiques ou aux
                    scénarios d&apos;usage (ex : &quot;tu expliques cela à un
                    client&quot;).
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm text-base-content/70 sm:text-base">
                Avec Clara, vous pouvez exploiter ces subtilités selon le modèle
                utilisé, pour obtenir des réponses plus claires, mieux formatées
                et vraiment adaptées à vos besoins.
              </p>
            </div>
          </div>
          <Separator />
        </>
      );

    case "support_admin":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              La page <strong>Support</strong> permet de configurer les
              fournisseurs IA, les modèles LLM et les paramètres système. Elle
              est accessible depuis le menu à tous les utilisateurs. Les onglets
              disponibles sont : <strong>LLM</strong>,{" "}
              <strong>Providers</strong>, <strong>Paramètres</strong> et{" "}
              <strong>Database</strong>.
            </p>

            {/* Onglet LLM */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 p-4 shadow-md ring-1 ring-primary/20">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-3 text-xl font-semibold text-primary">
                    Onglet LLM — Gestion des modèles
                  </h4>
                  <p className="mb-4 text-base-content/80">
                    Cet onglet liste tous les modèles de langage (OpenAI, Anthropic,
                    Mistral, Google, etc.) et permet de les gérer.
                  </p>
                  <ul className="ml-6 list-disc space-y-2 text-base-content/80">
                    <li>
                      <strong>Ajouter un modèle :</strong> remplir le formulaire
                      en haut (fournisseur, identifiant technique, libellé,
                      tokens, etc.) puis enregistrer. Seuls les providers
                      activés dans l’onglet Providers apparaissent.
                    </li>
                    <li>
                      <strong>Modifier un modèle :</strong> chaque modèle
                      créé est affiché sous forme de carte. Cliquer sur le
                      bouton <strong>Modifier</strong> de la carte pour ouvrir
                      le formulaire, modifier les champs puis enregistrer.
                    </li>
                    <li>
                      <strong>Activer / Désactiver :</strong> utiliser le
                      bouton prévu dans le tableau pour activer ou désactiver un
                      modèle sans le supprimer.
                    </li>
                    <li>
                      <strong>Modèle par défaut :</strong> vous pouvez marquer
                      un modèle comme « par défaut » (icône étoile) ; il sera
                      proposé en priorité dans l’app.
                    </li>
                    <li>
                      <strong>Supprimer :</strong> supprimer définitivement un
                      modèle du catalogue. Action irréversible.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Onglet Providers */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-secondary/20 to-secondary/10 p-4 shadow-md ring-1 ring-secondary/20">
                  <Server className="h-10 w-10 text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-3 text-xl font-semibold text-secondary">
                    Onglet Providers — Fournisseurs IA
                  </h4>
                  <p className="mb-4 text-base-content/80">
                    Les providers (OpenAI, Anthropic, Mistral, Google, etc.)
                    regroupent les modèles LLM. Vous devez en avoir au moins un
                    activé pour utiliser des modèles dans l’onglet LLM.
                  </p>
                  <ul className="ml-6 list-disc space-y-2 text-base-content/80">
                    <li>
                      <strong>Ajouter un provider :</strong> bouton dédié, puis
                      renseigner l’identifiant (value), le libellé (label) et le
                      texte de description. Le provider est créé activé par défaut.
                    </li>
                    <li>
                      <strong>Modifier :</strong> cliquer sur l’icône crayon
                      pour modifier value, label, text ou activer/désactiver le
                      provider.
                    </li>
                    <li>
                      <strong>Supprimer :</strong> la suppression d’un provider
                      désactive tous les modèles qui en dépendent. Action
                      irréversible.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Onglet Paramètres */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-accent/20 to-accent/10 p-4 shadow-md ring-1 ring-accent/20">
                  <Settings className="h-10 w-10 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-3 text-xl font-semibold text-accent">
                    Onglet Paramètres — Configuration globale
                  </h4>
                  <p className="mb-4 text-base-content/80">
                    En haut de la page, le bloc <strong>Paramètres rapides</strong> permet
                    de configurer deux réglages essentiels.
                  </p>

                  <div className="mb-6 rounded-lg bg-warning/10 p-4 ring-1 ring-warning/20">
                    <h5 className="mb-2 font-semibold text-warning">
                      Modèle par défaut (Speed Create)
                    </h5>
                    <p className="text-sm text-base-content/80">
                      La liste déroulante affiche tous les modèles LLM configurés
                      dans l’onglet LLM. Vous devez <strong>obligatoirement en
                      sélectionner un</strong> pour que la <strong>Création
                      rapide</strong> (Speed Create) fonctionne. Sans modèle
                      sélectionné (ou sans aucun modèle LLM configuré), la
                      création rapide d’agents et d’experts ne pourra pas
                      s’exécuter. Pensez à en choisir un après avoir ajouté des
                      modèles dans l’onglet LLM.
                    </p>
                  </div>

                  <div className="rounded-lg bg-base-300/30 p-4">
                    <h5 className="mb-2 flex items-center gap-2 font-semibold text-base-content">
                      <Target className="h-5 w-5 text-primary" />
                      Seuil de similarité RAG
                    </h5>
                    <p className="mb-3 text-sm text-base-content/80">
                      Ce réglage s’applique aux <strong>experts</strong> : il
                      détermine quels passages de vos documents sont retenus
                      pour répondre à une question (recherche vectorielle). Trois
                      niveaux sont proposés :
                    </p>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-base-content/80">
                      <li>
                        <strong>Strict (0,5) :</strong> seuls les passages très
                        proches de la question sont gardés — réponses plus
                        ciblées, moins de contexte.
                      </li>
                      <li>
                        <strong>Normal (0,85) :</strong> bon équilibre entre
                        précision et quantité de contexte (recommandé par
                        défaut).
                      </li>
                      <li>
                        <strong>Permissif (1,0) :</strong> plus de contexte
                        inclus — utile si les réponses manquent d’informations.
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-base-content/60">
                      Le seuil correspond à une distance L2 en recherche
                      vectorielle. Il est enregistré en base et pris en compte
                      à chaque message envoyé à un expert.
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-base-content/70">
                    Sous les paramètres rapides, vous trouverez les prompts
                    système (Agent, Expert, etc.) et la liste des placeholders
                    utilisables. Vous pouvez les modifier directement dans les
                    champs texte.
                  </p>
                </div>
              </div>
            </div>

            {/* Onglet Database */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl">
              <h4 className="mb-3 text-xl font-semibold text-base-content">
                Onglet Database
              </h4>
              <p className="text-base-content/80">
                Réservé aux <strong>admin</strong>. Permet la sauvegarde et la
                restauration de la base de données (export / import). À utiliser
                avec précaution en environnement de production.
              </p>
            </div>
          </div>
          <Separator />
        </>
      );

    case "support":
      return (
        <>
          <div className="space-y-8">
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 backdrop-blur-xl sm:p-6">
              <h4 className="mb-4 text-lg font-semibold text-primary sm:text-xl">
                FAQ Modèles Personnalisés
              </h4>

              <div className="space-y-4 sm:space-y-6">
                {/* Création d'agent/expert */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment créer un agent ou expert ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Pour créer un agent ou expert, suivez ces étapes :
                  </p>
                  <ol className="ml-4 mt-3 space-y-2 text-sm leading-relaxed text-base-content/70">
                    <li>
                      1. Cliquez sur le bouton{" "}
                      <strong>&quot;Créer&quot;</strong> dans la sidebar
                    </li>
                    <li>
                      2. Choisissez entre{" "}
                      <strong>&quot;Modèles Personnels&quot;</strong> ou{" "}
                      <strong>&quot;Modèles Clara&quot;</strong>
                    </li>
                    <li>
                      3. Sélectionnez <strong>&quot;Agent&quot;</strong> ou{" "}
                      <strong>&quot;Expert&quot;</strong>
                    </li>
                    <li>
                      4. Choisissez entre{" "}
                      <strong>&quot;Création Avancée&quot;</strong> ou{" "}
                      <strong>&quot;Création Rapide&quot;</strong>
                    </li>
                  </ol>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/70">
                    <strong>Création Rapide</strong> est recommandé pour
                    débuter, tandis que <strong>Création Avancée</strong> vous
                    permet de personnaliser tous les paramètres.
                  </p>
                </div>

                {/* Modification d'agent/expert */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment modifier un agent ou expert ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Cliquez sur l&apos;icône{" "}
                    <MoreVertical className="inline h-4 w-4" /> à côté de votre
                    assistant, puis sélectionnez
                    <strong>&quot;Modifier&quot;</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Un onglet s&apos;ouvrira vous permettant de modifier le nom,
                    le prompt, les paramètres, et d&apos;ajouter des documents à
                    la base de connaissances pour les experts.
                  </p>
                </div>

                {/* Suppression d'agent/expert */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment supprimer un agent ou expert ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Cliquez sur l&apos;icône{" "}
                    <MoreVertical className="inline h-4 w-4" /> à côté de votre
                    assistant, puis sélectionnez{" "}
                    <strong>&quot;Supprimer&quot;</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Une confirmation vous sera demandée pour éviter les
                    suppressions accidentelles. Attention : cette action est
                    irréversible.
                  </p>
                </div>

                {/* Effacer les messages */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment effacer les messages de mon chat ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Dans votre conversation, cliquez sur l&apos;icône{" "}
                    <MessageCircleOff className="inline h-4 w-4" /> en haut à
                    gauche de la page chat, puis sélectionnez{" "}
                    <strong>&quot;Effacer l&apos;historique&quot;</strong>.
                  </p>
                </div>

                {/* App locale : pas de facturation */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Y a-t-il des limites ou une facturation ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    En déploiement <strong>local</strong>, Clara fonctionne sans
                    abonnement ni facturation. Messages et stockage sont
                    illimités, les fournisseurs et modèles sont configurés dans
                    <strong> Support</strong>.
                  </p>
                </div>

                {/* Déconnexion de session */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Je me suis fait déconnecter de ma session en pleine
                    utilisation
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Cette déconnexion automatique est liée à notre système de{" "}
                    <strong>sécurité multi-session</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Cela signifie qu&apos;une autre personne s&apos;est
                    connectée avec vos identifiants depuis un autre appareil ou
                    un autre onglet/navigateur sur votre réseau local.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Pour éviter cela, assurez-vous de vous déconnecter sur tous
                    vos appareils et changez votre mot de passe si nécessaire.
                  </p>
                </div>

                {/* Mot de passe oublié / réinitialisation */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    J&apos;ai oublié mon mot de passe
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    En déploiement local, la réinitialisation par email
                    n&apos;est pas disponible. Demandez à un administrateur
                    d&apos;exécuter le script <strong>createClaraUser</strong>{" "}
                    pour réinitialiser ou recréer votre compte.
                  </p>
                </div>

                {/* Température des modèles */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Pourquoi mon modèle est long à répondre ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Si votre modèle met du temps à répondre, cela peut être dû à
                    la configuration de la <strong>température</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Une température élevée (2) oblige le modèle à explorer plus
                    de possibilités dans sa génération, ce qui peut augmenter le
                    temps de réponse.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    À l&apos;inverse, une température basse (0) réduit la
                    créativité et accélère les réponses.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Si vous avez besoin de réponses rapides et factuelles,
                    ajustez la température à une valeur basse (0). Pour des
                    réponses plus créatives ou ouvertes, préférez une
                    température plus élevée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      );

    default:
      return null;
  }
  /////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
}
