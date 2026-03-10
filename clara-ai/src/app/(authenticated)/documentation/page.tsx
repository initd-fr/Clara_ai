"use client";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useMemo } from "react";
import {
  Bot,
  Brain,
  Sparkles,
  Zap,
  Cpu,
  EllipsisVertical,
  FileText,
  Upload,
  // ChevronDown, // Non utilisé
  Star,
  MoreVertical,
  MessageCircleOff,
  CheckCircle,
} from "lucide-react";
import { api } from "~/trpc/react";
import SecondaryLoader from "~/components/SecondaryLoader";
import Image from "next/image";
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

export default function DocumentationPage() {
  // ^ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const subscriptionConfigs: Record<string, unknown>[] = [];
  const isLoadingSubscriptions = false;

  const sections = useMemo(
    () => [
      { id: "introduction", title: "" },
      { id: "accounts", title: "" },
      { id: "model_creation", title: "" },
      { id: "models", title: "" },
      { id: "files", title: "" },
      { id: "abonnements", title: "" },
      { id: "roadmap", title: "" },
      { id: "best_practices", title: "" },
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
                {getContent(
                  section.id,
                  isLoadingSubscriptions,
                  subscriptionConfigs as unknown as Record<string, unknown>[],
                )}
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
    case "abonnements":
      return "💼 Abonnements & Limitations";
    case "roadmap":
      return "🔬 Roadmap Clara AI";
    case "best_practices":
      return "💡 Bonnes Pratiques";
    case "support":
      return "🤝 Support & Assistance";
    default:
      return "";
  }
}

function getContent(
  id: string,
  isLoadingSubscriptions: boolean,
  subscriptionConfigs: Record<string, unknown>[],
) {
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
            Clara propose deux approches complémentaires : une interface où
            chaque utilisateur peut créer ses propres assistants IA, et un
            environnement guidé où il peut exploiter des agents prêts à
            l&apos;emploi, conçus par nos équipes pour des usages professionnels
            ciblés.
          </p>
          <br />
          <p className="text-xl font-normal">
            Grâce à une interface fluide, des outils puissants et une
            architecture hybride, Clara AI s&apos;adapte aussi bien aux besoins
            des novices qu&apos;aux exigences des experts.
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

              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="flex-shrink-0 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-3 shadow-md ring-1 ring-orange-500/20 sm:p-4">
                    <Bot className="h-8 w-8 text-orange-500/70 sm:h-12 sm:w-12" />
                  </div>
                  <div className="flex-1">
                    <h5 className="mb-2 text-lg font-semibold text-orange-500 sm:text-xl">
                      Modèles Clara
                    </h5>
                    <p className="text-base font-normal sm:text-xl">
                      Modèles d&apos;IA hybrides conçus par nos ingénieurs,
                      intégrant logique symbolique, modèles statistiques, et
                      grands modèles de langage. Chaque modèle est développé en
                      collaboration avec des experts de terrain, pour répondre à
                      des besoins métiers ciblés : droit, santé, finance...
                      <br />
                      <br />
                      Ces modèles prêts à l&apos;emploi sont maintenus,
                      documentés et mis à jour régulièrement. Ils sont
                      accessibles via des abonnements spécialisés.
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
              • Soit vous utilisez un modèle Clara déjà configuré et maintenu
              par nos équipes
              <br />• Soit vous créez un agent ou expert personnalisé, adapté à
              vos propres besoins
            </p>

            {/* Clara Model Usage */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-4 shadow-md ring-1 ring-orange-500/20">
                  <Bot className="h-12 w-12 text-orange-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-orange-500">
                    Utiliser un modèle Clara
                  </h4>
                  <p className="text-base font-normal sm:text-xl">
                    Si vous êtes abonné à un modèle Clara ou que vous avez
                    activé un modèle gratuit, vous pouvez ouvrir autant de chats
                    que nécessaire avec ce modèle préconfiguré.
                    <br />
                    <br />
                    Vous pouvez nommer vos conversations, les organiser ou les
                    retrouver facilement. Le comportement du modèle est maintenu
                    tel quel, avec des mises à jour régulières par nos
                    ingénieurs IA.
                    <br />
                    <br />
                    Une solution idéale si vous cherchez à utiliser une IA
                    experte métier immédiatement, sans paramétrage.
                  </p>
                </div>
              </div>
            </div>

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
              modules spécialisés de machine learning, deep learning ou logique
              symbolique, selon les besoins.
            </p>
            <p className="text-xl font-normal">
              Cette approche hybride nous permet de renforcer la précision, la
              cohérence et l&apos;utilité des réponses.
              <br /> <br /> Par exemple, certains assistants exploitent des
              modèles tabulaires ou des algorithmes d&apos;analyse prédictive,
              en complément du modèle de langage.
            </p>
            <p className="text-xl font-normal">
              Nos fournisseurs sont rigoureusement sélectionnés selon des
              critères techniques stricts, mais aussi éthiques : performance,
              stabilité, documentation, respect de la confidentialité et
              conformité aux normes de sécurité.
              <br /> <br /> Aucune donnée utilisateur n&apos;est utilisée à des
              fins commerciales, revendues à des tiers ou détournée.
              <br /> <br /> Tout ce qui est stocké ou traité dans Clara reste
              exclusivement privé et contrôlé.
            </p>
            <p className="text-xl font-normal">
              Contrairement à certaines plateformes qui prétendent proposer un
              &quot;Modèle de langage maison&quot;, nous avons fait le choix de
              la transparence et de la robustesse.
              <br /> <br />
              Clara tire parti des investissements massifs des meilleurs
              fournisseurs tout en les augmentant via ses propres systèmes :
              récupération d&apos;informations contextualisées, vérification
              croisée, et logique de génération guidée.
              <br /> <br />
              Neanmoins, certains modèles Clara sonts développés par nos
              équipes.
            </p>
            <p className="text-xl font-normal">
              Résultat : une IA augmentée, située, documentée, qui s&apos;adapte
              à votre contexte et apprend de vos données sans compromis sur la
              qualité ou la sécurité.
            </p>
            <h5 className="text-xl font-normal">
              Voici les fournisseurs disponibles sur Clara AI :
            </h5>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {/* Clara AI */}
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-4">
                <div className="mb-2 flex items-center justify-center">
                  <Image
                    width={48}
                    height={48}
                    src="/LogoCai.png"
                    alt="Clara AI"
                    className="h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20"
                  />
                </div>
                <div className="text-center">
                  <h6 className="text-sm font-semibold text-purple-500 sm:text-base">
                    Clara AI
                  </h6>
                </div>
              </div>

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
            <p className="text-xl font-normal">
              Cette liste n&apos;est pas exhaustive, et nous ajoutons de
              nouveaux fournisseurs régulièrement si ceux-ci respectent les
              critères techniques et éthiques.
            </p>
          </div>
          <Separator />
        </>
      );

    case "files":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              Clara gère deux types de documents, selon votre usage et votre
              abonnement :
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
    case "abonnements":
      return (
        <>
          <div className="space-y-8">
            <p className="text-xl font-normal">
              Clara propose plusieurs formules pour s&apos;adapter à tous les
              besoins.
              <br /> <br /> Voici les principaux avantages de chaque plan :
            </p>

            {isLoadingSubscriptions ? (
              <div className="flex items-center justify-center p-8">
                <SecondaryLoader />
              </div>
            ) : subscriptionConfigs.length > 0 ? (
              subscriptionConfigs
                .filter(
                  (config: Record<string, unknown>) => config.isActive === true,
                )
                .map((config: Record<string, unknown>) => {
                  // Déterminer l&apos;icône et les couleurs basées sur les propriétés de l&apos;abonnement
                  const getIconAndColors = (
                    config: Record<string, unknown>,
                  ) => {
                    // Abonnement modèle store (orange + Bot)
                    if (
                      config.canAccessStoreModels &&
                      !config.canCreatePersonalModels
                    ) {
                      return {
                        icon: Bot,
                        colors: "from-orange-500 to-orange-500",
                      };
                    }

                    // Abonnement par défaut (primary + Sparkles)
                    if (config.isDefault) {
                      return {
                        icon: Sparkles,
                        colors: "from-primary to-primary",
                      };
                    }

                    // Abonnement pour créer des modèles personnels (violet + Brain)
                    if (config.canCreatePersonalModels) {
                      return {
                        icon: Brain,
                        colors: "from-violet-500 to-violet-500",
                      };
                    }

                    // Fallback par défaut
                    return {
                      icon: Star,
                      colors: "from-secondary to-secondary",
                    };
                  };

                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { icon: Icon, colors } = getIconAndColors(config);

                  return (
                    <div
                      key={config.id as string}
                      className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      <div className="flex items-start gap-4">
                        {config.canAccessStoreModels &&
                        !config.canCreatePersonalModels ? (
                          <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-4 shadow-md ring-1 ring-orange-500/20">
                            <Bot className="h-12 w-12 text-orange-500/70" />
                          </div>
                        ) : config.isDefault ? (
                          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 shadow-md ring-1 ring-primary/20">
                            <Sparkles className="h-12 w-12 text-primary/70" />
                          </div>
                        ) : config.canCreatePersonalModels ? (
                          <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 p-4 shadow-md ring-1 ring-violet-500/20">
                            <Brain className="h-12 w-12 text-violet-500/70" />
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 shadow-md ring-1 ring-secondary/20">
                            <Star className="h-12 w-12 text-secondary/70" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="mb-4 text-xl font-semibold text-base-content">
                            {config.name as string}
                          </h4>
                          {(config.description as string | undefined) && (
                            <p className="mt-5 text-xl font-normal">
                              {config.description as string}
                            </p>
                          )}
                          <ul className="ml-6 mt-4 list-disc space-y-2">
                            {(config.dailyMessageLimit as
                              | number
                              | undefined) ? (
                              <li>
                                {config.dailyMessageLimit as number} messages
                                par jour
                              </li>
                            ) : (
                              <li>Messages illimités</li>
                            )}
                            {(config.storageLimitGB as number | undefined) ? (
                              <li>
                                {config.storageLimitGB as number} GB de stockage
                              </li>
                            ) : (
                              <li>Stockage illimité</li>
                            )}
                            {(config.maxPersonalModels as
                              | number
                              | undefined) ? (
                              <li>
                                Jusqu&apos;à{" "}
                                {config.maxPersonalModels as number} modèles
                                personnels
                              </li>
                            ) : (
                              <li>Modèles personnels illimités</li>
                            )}
                            {(config.canCreatePersonalModels as boolean) && (
                              <li>Création de modèles personnels</li>
                            )}
                            {(config.canAccessTeamFeatures as boolean) && (
                              <li>Fonctionnalités d&apos;équipe</li>
                            )}
                            {Array.isArray(config.features) &&
                              (config.features as string[]).length > 0 &&
                              (config.features as string[]).map(
                                (feature: string, featureIndex: number) => (
                                  <li key={featureIndex}>{feature}</li>
                                ),
                              )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 text-center">
                <p className="text-base-content/70">
                  Aucun abonnement configuré pour le moment.
                </p>
              </div>
            )}

            {/* Section Gestion des Abonnements */}
            <div className="mt-12 space-y-8">
              <h3 className="text-2xl font-bold text-base-content">
                💳 Gestion des Abonnements & Avoirs
              </h3>

              <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl">
                <h4 className="mb-4 text-xl font-semibold text-primary">
                  🔄 Changement d&apos;Abonnement
                </h4>
                <p className="mb-4 text-base font-normal">
                  Clara utilise un système équitable de prorations et
                  d&apos;avoirs pour tous les changements d&apos;abonnement.
                </p>

                <div className="space-y-6">
                  {/* Augmentation d'abonnement */}
                  <div className="rounded-lg bg-emerald-500/10 p-4">
                    <h5 className="mb-2 text-lg font-semibold text-emerald-600">
                      📈 Augmentation d&apos;Abonnement
                    </h5>
                    <p className="text-sm text-base-content/70">
                      Lorsque vous passez à un abonnement plus cher :
                    </p>
                    <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-base-content/70">
                      <li>Le changement est immédiat</li>
                      <li>
                        La différence est immédiatement facturée au prorata des
                        jours restants
                      </li>
                      <li>Accès immédiat aux nouvelles fonctionnalités</li>
                    </ul>
                  </div>

                  {/* Diminution d'abonnement */}
                  <div className="rounded-lg bg-blue-500/10 p-4">
                    <h5 className="mb-2 text-lg font-semibold text-blue-600">
                      📉 Diminution d&apos;Abonnement
                    </h5>
                    <p className="text-sm text-base-content/70">
                      Lorsque vous passez à un abonnement moins cher :
                    </p>
                    <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-base-content/70">
                      <li>
                        Le changement est programmé pour la fin de la période en
                        cours
                      </li>
                      <li>
                        Vous gardez toutes les fonctionnalités jusqu&apos;à la
                        date de changement
                      </li>
                      <li>
                        Le nouveau tarif sera appliqué à la prochaine période
                      </li>
                    </ul>
                  </div>

                  {/* Exemple concret */}
                  <div className="rounded-lg bg-base-100/50 p-4">
                    <h5 className="mb-2 text-lg font-semibold text-base-content">
                      💡 Exemples Concrets
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 font-medium text-base-content">
                          Upgrade (passage à un plan supérieur) :
                        </p>
                        <ul className="ml-6 list-disc space-y-1 text-sm text-base-content/70">
                          <li>
                            De 20€ à 50€/mois : facturation immédiate de la
                            différence au prorata
                          </li>
                          <li>
                            Accès immédiat à toutes les fonctionnalités du
                            nouveau plan
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 font-medium text-base-content">
                          Downgrade (passage à un plan inférieur) :
                        </p>
                        <ul className="ml-6 list-disc space-y-1 text-sm text-base-content/70">
                          <li>
                            De 50€ à 20€/mois : le plan actuel reste actif
                            jusqu&apos;à la fin du mois
                          </li>
                          <li>
                            Le nouveau tarif de 20€ sera appliqué au début de la
                            prochaine période
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Separator />
        </>
      );

    case "roadmap":
      return (
        <>
          <div className="space-y-12">
            <div className="text-center">
              <p className="mx-auto max-w-3xl text-xl text-base-content/70">
                Découvrez notre vision et les étapes de développement de Clara
                AI
              </p>
              <p className="mx-auto max-w-3xl text-xl text-base-content/70">
                Cette roadmap est à titre indicatif et peut être modifiée à tout
                moment.
              </p>
            </div>

            {/* Timeline personnalisée */}
            <div className="mx-auto max-w-7xl px-2 sm:px-4">
              <div className="relative">
                {/* Ligne de connexion - cachée sur mobile */}
                <div className="absolute left-0 right-0 top-8 hidden h-1 rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 sm:block"></div>

                {/* Container des steps */}
                <div className="relative flex flex-wrap items-start justify-center gap-4 sm:justify-between sm:gap-0">
                  {/* MVP */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q1
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        MVP
                      </div>
                    </div>
                  </div>

                  {/* Alpha */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q2
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        Alpha
                      </div>
                    </div>
                  </div>

                  {/* Beta */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q3
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        Beta
                      </div>
                    </div>
                  </div>

                  {/* Accès Anticipé */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-cyan-500 to-cyan-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q4
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="animate-pulse rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        Accès Anticipé
                      </div>
                    </div>
                  </div>

                  {/* v1.0 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-pink-500 to-pink-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q5
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        v1.0
                      </div>
                    </div>
                  </div>

                  {/* v2.0 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      Q6
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        v2.0
                      </div>
                    </div>
                  </div>

                  {/* Future */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-gray-500 to-gray-600 text-sm font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                      ...
                    </div>
                    <div className="mt-2 text-center sm:mt-4">
                      <div className="rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                        Future
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails des versions */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-emerald-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-emerald-500">
                    MVP
                  </h5>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li>✓ Interface de base</li>
                    <li>✓ Chat avec IA</li>
                    <li>✓ Gestion des modèles</li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-blue-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-blue-500">
                    Alpha
                  </h5>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li>✓ Analyse contextuelle</li>
                    <li>✓ Ajoute des experts</li>
                    <li>✓ Recherche web</li>
                    <li>✓ Analytics de base</li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-purple-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-purple-500">
                    Beta
                  </h5>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li>✓ Connexion avec Google</li>
                    <li>✓ Upload de fichiers</li>
                    <li>✓ Refonte de l&apos;interface</li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-cyan-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-cyan-500">
                    Accès Anticipé
                  </h5>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li>✓ Agent conversationnel simple</li>
                    <li>✓ Expert RAG</li>
                    <li>✓ Création avancée ou rapide</li>
                    <li>
                      ✓ Gestion documents temporaires (PDF, TXT, CSV, DOCX,
                      XLSX, RTF, JPG, PNG, GIF, WEBP)
                    </li>
                    <li>✓ Fonctionnalité Simplify</li>
                    <li>✓ Providers : OpenAI, Mistral, Anthropic, Google</li>
                    <li>✓ Modèles Clara</li>
                    <li>✓ Abonnements accès plateforme</li>
                    <li>✓ Abonnements packages</li>
                    <li>✓ Abonnements modèles Clara</li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-pink-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-pink-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-pink-500">v1.0</h5>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li>✓ Nouveaux providers IA</li>
                    <li>✓ Nouveaux modèles LLM</li>
                    <li>✓ Clara Team ( équipes d&apos;IA spécialisée)</li>
                    <li className="italic text-base-content/50">
                      Autres fonctionnalités à définir
                    </li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6 transition-all duration-300 hover:scale-105 hover:border-indigo-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <h5 className="mb-3 text-xl font-bold text-indigo-500">
                    v2.0
                  </h5>
                  <p className="text-sm italic text-base-content/70">
                    Cette version n&apos;est pas encore officiellement définie.
                    Les fonctionnalités seront annoncées prochainement selon
                    l&apos;évolution de nos priorités et les retours
                    utilisateurs.
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
              <h3>Abonnement </h3>
              <h4 className="mb-4 text-xl font-semibold text-primary">
                Optimiser vos Interactions
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

    case "support":
      return (
        <>
          <div className="space-y-8">
            {/* Système de Tickets */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 shadow-md ring-1 ring-blue-500/20">
                  <FileText className="h-12 w-12 text-blue-500/70" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 text-xl font-semibold text-blue-500">
                    Système de Tickets de Support
                  </h4>
                  <p className="text-base font-normal sm:text-xl">
                    Notre système de tickets vous permet de suivre vos demandes
                    de support de manière organisée et transparente.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg bg-blue-500/10 p-4">
                      <h5 className="mb-2 text-lg font-semibold text-blue-600">
                        📝 Comment créer un ticket
                      </h5>
                      <ol className="ml-6 list-decimal space-y-1 text-sm text-base-content/70">
                        <li>
                          Accédez au Centre d&apos;Aide via le bouton ci-dessus
                        </li>
                        <li>Cliquez sur &quot;Nouveau ticket&quot;</li>
                        <li>Remplissez le formulaire avec :</li>
                        <ul className="ml-6 mt-2 list-disc space-y-1">
                          <li>Titre de votre demande</li>
                          <li>Description détaillée du problème</li>
                          <li>Page où le problème se produit</li>
                          <li>Captures d&apos;écran si nécessaire</li>
                        </ul>
                        <li>Cliquez sur &quot;Envoyer&quot;</li>
                      </ol>
                    </div>

                    <div className="rounded-lg bg-green-500/10 p-4">
                      <h5 className="mb-2 text-lg font-semibold text-green-600">
                        🔄 Processus de résolution
                      </h5>
                      <div className="space-y-2 text-sm text-base-content/70">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                          <span>
                            <strong>Ouvert :</strong> Votre ticket a été reçu
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span>
                            <strong>En cours :</strong> Un membre de
                            l&apos;équipe traite votre demande
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span>
                            <strong>Résolu :</strong> Votre problème a été
                            résolu
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                          <span>
                            <strong>Fermé :</strong> Le ticket est fermé après
                            confirmation
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-500/10 p-4">
                      <h5 className="mb-2 text-lg font-semibold text-purple-600">
                        📧 Notifications par email
                      </h5>
                      <p className="text-sm text-base-content/70">
                        Vous recevrez automatiquement des emails pour vous tenir
                        informé de l&apos;avancement de votre ticket :
                      </p>
                      <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-base-content/70">
                        <li>Confirmation de création du ticket</li>
                        <li>
                          Notification de prise en charge par l&apos;équipe
                        </li>
                        <li>Mises à jour sur l&apos;avancement</li>
                        <li>Notification de résolution</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 backdrop-blur-xl sm:p-6">
              <h4 className="mb-4 text-lg font-semibold text-primary sm:text-xl">
                FAQ Abonnement Modèles Personnalisés
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

                {/* Consulter les factures */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment consulter mes factures ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Vos factures sont disponibles sur votre{" "}
                    <strong>page Paramètres</strong>, accessible depuis le
                    bouton de la sidebar.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Dans la section <strong>&quot;Facturation&quot;</strong>,
                    vous trouverez l&apos;historique complet de vos paiements et
                    pourrez télécharger vos factures au format PDF.
                  </p>
                </div>

                {/* Changer d'abonnement */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment changer mon abonnement ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Depuis la sidebar, cliquez sur <strong>Paramètres</strong>,
                    puis dans la section{" "}
                    <strong>&quot;Gestion de l&apos;abonnement&quot;</strong>,
                    cliquez sur <strong>&quot;Changer de plan&quot;</strong>.
                    Vous pourrez choisir votre nouvel abonnement dans la page
                    Paramètres.
                  </p>
                </div>

                {/* Limites dynamiques */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    Comment fonctionnent les limites de mon abonnement ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Clara utilise un système de limites dynamiques qui
                    s&apos;adaptent à votre abonnement actuel.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Vos limites (messages quotidiens, stockage, modèles
                    personnels) sont automatiquement mises à jour selon votre
                    plan d&apos;abonnement. Vous pouvez voir vos limites
                    actuelles dans la sidebar dans la section information
                    utilisateur. Cliquez sur la flèche pour déplier les détails.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Si vous ne voyez pas vos limites, c&apos;est que vous avez
                    souscrit à un modèle Clara qui ne sonts pas limité.
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
                    connectée avec vos identifiants depuis un autre appareil.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Pour éviter cela, assurez-vous de vous déconnecter sur tous
                    vos appareils et changez votre mot de passe si nécessaire.
                  </p>
                </div>

                {/* Mot de passe oublié */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-primary sm:text-lg">
                    J&apos;ai oublié mon mot de passe
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Accédez à votre <strong>page Paramètres</strong> depuis le
                    bouton de la sidebar.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Dans la section <strong>&quot;Sécurité&quot;</strong>, vous
                    trouverez l&apos;option pour changer votre mot de passe.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Si vous ne pouvez plus accéder à votre compte, utilisez la
                    fonction <strong>&quot;Mot de passe oublié&quot;</strong>{" "}
                    sur la page de connexion.
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

            {/* FAQ pour les modèles Clara */}
            <div className="rounded-xl border border-base-300/50 bg-base-200/50 p-4 backdrop-blur-xl sm:p-6">
              <h4 className="mb-4 text-lg font-semibold text-orange-500 sm:text-xl">
                FAQ Abonnement Modèles Clara
              </h4>

              <div className="space-y-4 sm:space-y-6">
                {/* S'abonner à un modèle Clara */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    Comment s&apos;abonner à un modèle Clara ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Depuis la sidebar, cliquez sur{" "}
                    <strong>Paramètres</strong>, puis dans la section{" "}
                    <strong>&quot;Gestion de l&apos;abonnement&quot;</strong>.
                    Choisissez le plan souhaité et validez votre choix.
                  </p>
                </div>

                {/* Créer un chat avec un modèle Clara */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    Comment créer un chat avec un modèle Clara ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Une fois abonné à un modèle Clara, vous pouvez créer autant
                    de chats que nécessaire :
                  </p>
                  <ol className="ml-4 mt-3 space-y-2 text-sm leading-relaxed text-base-content/70">
                    <li>
                      1. Cliquez sur &quot;Créer&quot; et choisissez
                      &quot;Modèles Clara&quot;.
                    </li>
                    <li>
                      2. Si vous disposer de plusieurs modèles Clara, vous
                      pourrez choisir le modèle que vous souhaitez utiliser.
                    </li>
                  </ol>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/70">
                    3. Un fois le modèle choisi, un nouveau chat apparaîtra
                    automatiquement dans votre sidebar, la modal se fermera
                    automatiquement et vous serait redirigé vers le nouveau
                    chat.
                  </p>
                </div>

                {/* Renommer un chat Clara */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    Comment renommer un chat Clara ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Pour renommer un chat avec un modèle Clara :
                  </p>
                  <ol className="ml-4 mt-3 space-y-2 text-sm leading-relaxed text-base-content/70">
                    <li>
                      1. Dans la sidebar, cliquez sur l&apos;icône{" "}
                      <MoreVertical className="inline h-4 w-4" /> à côté du chat
                    </li>
                    <li>
                      2. Sélectionnez <strong>&quot;Renommer&quot;</strong> dans
                      le menu
                    </li>
                    <li>
                      3. Tapez le nouveau nom et appuyez sur Entrée ou cliquez
                      ailleurs pour valider
                    </li>
                  </ol>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/70">
                    Le renommage est instantané et synchronisé sur tous vos
                    appareils.
                  </p>
                </div>

                {/* Supprimer un chat Clara */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    Comment supprimer un chat Clara ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Pour supprimer un chat avec un modèle Clara :
                  </p>
                  <ol className="ml-4 mt-3 space-y-2 text-sm leading-relaxed text-base-content/70">
                    <li>
                      1. Dans la sidebar, cliquez sur l&apos;icône{" "}
                      <MoreVertical className="inline h-4 w-4" /> à côté du chat
                    </li>
                    <li>
                      2. Sélectionnez <strong>&quot;Supprimer&quot;</strong>{" "}
                      dans le menu
                    </li>
                    <li>
                      3. Confirmez la suppression dans la boîte de dialogue
                    </li>
                  </ol>
                  <p className="mt-3 text-sm leading-relaxed text-base-content/70">
                    <strong>Attention :</strong> Cette action est irréversible
                    et supprime définitivement tous les messages du chat.
                  </p>
                </div>
                {/* Effacer les messages Clara */}
                <div className="rounded-lg bg-base-300/30 p-4 sm:p-6">
                  <h5 className="mb-3 text-base font-semibold text-orange-500 sm:text-lg">
                    Comment effacer les messages d&apos;un chat Clara ?
                  </h5>
                  <p className="text-sm leading-relaxed text-base-content/70">
                    Dans votre conversation avec un modèle Clara, cliquez sur
                    l&apos;icône <MessageCircleOff className="inline h-4 w-4" />{" "}
                    en haut à gauche de la page chat, puis sélectionnez{" "}
                    <strong>&quot;Effacer l&apos;historique&quot;</strong>.
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
