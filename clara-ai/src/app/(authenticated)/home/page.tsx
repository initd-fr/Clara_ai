"use client";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import Link from "next/link";
import Image from "next/image";
import { memo, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Book,
  Plus,
  ExternalLink,
  Github,
  Linkedin,
  Layers,
  Server,
  Database,
  Shield,
} from "lucide-react";
import { useSidebar } from "~/components/SidebarProvider";
import { APP_CONFIG } from "~/app/config";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
const TECH = [
  "Next.js",
  "TypeScript",
  "tRPC",
  "Prisma",
  "Tailwind",
  "OpenAI",
  "Anthropic",
] as const;
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

const HomeLogo = memo(function HomeLogo() {
  return (
    <div className="flex flex-col items-center" data-tour="logo-clara">
      <div className="relative flex h-[72px] w-full flex-row items-center justify-center sm:h-[80px]">
        <svg
          width="44"
          height="44"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 sm:h-12 sm:w-12"
        >
          <defs>
            <linearGradient
              id="home-c-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0099FF" />
              <stop offset="1" stopColor="#A259FF" />
            </linearGradient>
          </defs>
          <path
            d="M75 20 A35 35 0 1 0 75 80"
            stroke="url(#home-c-gradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="logo-gradient-wa -ml-1 mt-0.5 flex flex-row items-center gap-0 sm:-ml-2 sm:mt-1">
          <span className="bg-clip-text text-4xl font-normal text-transparent sm:text-5xl">
            lara
          </span>
        </div>
        <span
          className="ml-2 mt-2 text-3xl font-medium text-gray-400 sm:ml-3 sm:mt-3 sm:text-4xl"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: 2,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          AI
        </span>
      </div>
      <motion.div
        className="mx-auto mb-2 h-1 w-40 rounded-full sm:mb-3 sm:w-48"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background:
            "linear-gradient(90deg, #0055A4 0%, #0055A4 33.33%, #fff 33.33%, #fff 66.66%, #EF4135 66.66%, #EF4135 100%)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
});

const HeroSection = memo(function HeroSection({
  sectionMaxWidth,
  onCreateClick,
}: {
  sectionMaxWidth: string;
  onCreateClick: () => void;
}) {
  return (
    <section
      className={`relative w-full ${sectionMaxWidth} flex-shrink-0 overflow-hidden rounded-2xl border border-base-content/10 bg-gradient-to-br from-[#25f5ef]/5 via-[#931975]/10 to-[#580744]/15 px-6 py-10 shadow-lg backdrop-blur-sm sm:px-8 sm:py-12 md:px-10 md:py-14`}
      data-tour="home-hero"
    >
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full bg-[#25f5ef] blur-3xl" />
        <div className="absolute right-[15%] top-[40%] h-40 w-40 rounded-full bg-[#931975] blur-3xl" />
        <div className="absolute bottom-[15%] left-[30%] h-24 w-24 rounded-full bg-[#580744] blur-2xl" />
      </div>
      <div className="relative flex flex-col items-center text-center">
        <HomeLogo />
        <p className="mb-2 mt-6 max-w-2xl text-lg font-medium leading-snug text-base-content sm:text-xl md:text-2xl">
          Vos documents deviennent la base de vos réponses IA.
        </p>
        <p className="mb-8 max-w-xl text-sm text-base-content/60 sm:text-base">
          Grâce à notre moteur RAG
          <br />
          Créez des agents ou des experts pilotés par votre corpus.
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          data-tour="home-create-button"
          className="group relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/80 px-8 py-4 text-base font-semibold text-primary-content shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-100"
        >
          <Plus className="h-5 w-5" />
          <span>Créer un modèle</span>
          <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
        </button>
      </div>
    </section>
  );
});

const ValueSection = memo(function ValueSection({
  sectionMaxWidth,
}: {
  sectionMaxWidth: string;
}) {
  return (
    <section
      className={`w-full ${sectionMaxWidth} flex-shrink-0 rounded-2xl border border-base-content/10 bg-base-200/30 px-6 py-8 backdrop-blur-sm sm:px-8 sm:py-10`}
      data-tour="home-value"
    >
      <h2 className="title-medium mb-2 text-center text-xl text-base-content sm:text-2xl">
        Technologies & architecture
      </h2>
      <p className="mb-6 text-center text-sm text-base-content/60 sm:text-base">
        Ce qui fait Clara AI : stack, moteur IA et RAG en production.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100/80 p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#25f5ef]/20 to-[#931975]/20 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base-content">
            Architecture multi-tenant
          </h3>
          <p className="text-sm leading-relaxed text-base-content/70">
            Données isolées par modèle et par tenant. Chaque espace possède ses
            documents, embeddings et réponses. Le moteur IA filtre par modelId
            pour garantir la confidentialité.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100/80 p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#931975]/20 to-[#580744]/20 text-primary">
            <Server className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base-content">
            Moteur IA Archibald
          </h3>
          <p className="text-sm leading-relaxed text-base-content/70">
            FastAPI, Python 3.12, uv. Multi-LLM : OpenAI, Mistral, Anthropic,
            Gemini. Embeddings, RAG, recherche web Tavily. LangChain, pgvector,
            MinIO. Mode agent et mode expert avec similarité sur le corpus.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100/80 p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#580744]/20 to-[#25f5ef]/20 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base-content">RAG & documents</h3>
          <p className="text-sm leading-relaxed text-base-content/70">
            Embeddings OpenAI, recherche vectorielle par similarité cosinus,
            pgvector. Seuil de pertinence et retour des sources. PDF, DOCX,
            XLSX, CSV, TXT, RTF, JPEG, PNG, GIF, WebP. Contexte injecté dans le
            prompt expert.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100/80 p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base-content">
            Stack Clara & fiabilité
          </h3>
          <p className="text-sm leading-relaxed text-base-content/70">
            Next.js, TypeScript, tRPC, Prisma, PostgreSQL, BetterAuth. Caches
            embeddings, RAG et web. TokenAllocator, retry backoff, timeouts,
            compression GZip. Pydantic, authentification par clé API.
          </p>
        </div>
      </div>
    </section>
  );
});

const StackSection = memo(function StackSection({
  sectionMaxWidth,
}: {
  sectionMaxWidth: string;
}) {
  return (
    <section
      className={`w-full ${sectionMaxWidth} flex-shrink-0 rounded-2xl border border-base-content/10 bg-gradient-to-br from-[#25f5ef]/5 via-transparent to-[#580744]/10 px-6 py-6 sm:px-8 sm:py-8`}
      data-tour="home-stack"
    >
      <h2 className="title-medium mb-1 text-center text-lg text-base-content sm:text-xl">
        Stack
      </h2>
      <p className="mb-4 text-center text-xs text-base-content/60 sm:text-sm">
        Full-stack TypeScript · API type-safe · Postgres
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {TECH.map((label) => (
          <span
            key={label}
            className="rounded-full border border-base-content/15 bg-base-200/80 px-3 py-1.5 text-xs font-medium text-base-content/90 sm:px-4 sm:py-2 sm:text-sm"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
});

const QuickLinksSection = memo(function QuickLinksSection({
  sectionMaxWidth,
}: {
  sectionMaxWidth: string;
}) {
  return (
    <section
      className={`flex w-full ${sectionMaxWidth} flex-shrink-0 justify-center px-4`}
      data-tour="home-links"
    >
      <Link
        href="/documentation"
        className="group relative flex items-center gap-2 overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 px-6 py-3 text-sm font-medium text-base-content shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-content/20 hover:bg-base-200 hover:shadow-md"
        data-tour="documentation-button"
      >
        <Book className="h-5 w-5 text-primary" />
        <span>Documentation</span>
        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
      </Link>
    </section>
  );
});

const GITHUB_URL = "https://github.com/initd-fr";
const LINKEDIN_URL =
  "https://www.linkedin.com/in/quentin-van-steenwinkel-534919232/";

const DeveloperCard = memo(function DeveloperCard({
  sectionMaxWidth,
}: {
  sectionMaxWidth: string;
}) {
  return (
    <section
      className={`w-full ${sectionMaxWidth} flex-shrink-0 overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-lg`}
      data-tour="home-developer"
    >
      {/* Bannière style profil (DA) */}
      <div className="relative h-24 w-full sm:h-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#25f5ef]/20 via-[#931975]/25 to-[#580744]/30" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[10%] top-[20%] h-20 w-20 rounded-full bg-[#25f5ef] blur-2xl" />
          <div className="absolute right-[20%] top-[40%] h-24 w-24 rounded-full bg-[#931975] blur-2xl" />
          <div className="absolute bottom-[10%] left-[30%] h-16 w-16 rounded-full bg-[#580744] blur-xl" />
        </div>
      </div>
      {/* Avatar rond + contenu */}
      <div className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8 sm:pt-0">
        <div className="-mt-12 flex justify-center sm:-mt-14">
          <div className="relative flex h-24 w-24 overflow-hidden rounded-full border-4 border-base-100 bg-base-200 shadow-xl ring-2 ring-base-content/10 sm:h-28 sm:w-28">
            <Image
              src="/img/Init.png"
              alt="initd-fr"
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>
        </div>
        <p className="mb-1 mt-4 text-center text-sm font-medium uppercase tracking-wider text-base-content/60">
          Développé par initd-fr
        </p>
        <p className="mb-4 text-center text-sm leading-relaxed text-base-content/70 sm:text-base">
          Full-stack · Backend · Systems · Applied AI · API design, architecture
          SaaS, Linux, CI/CD
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-base-content/15 bg-base-200/80 px-4 py-2.5 text-sm font-medium text-base-content shadow-sm transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-md"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-base-content/15 bg-base-200/80 px-4 py-2.5 text-sm font-medium text-base-content shadow-sm transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-md"
          >
            <Linkedin className="h-5 w-5" />
            <span>LinkedIn</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </section>
  );
});

/////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function HomePage() {
  const { isOpen: isSidebarOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sectionMaxWidth = useMemo(
    () =>
      isSidebarOpen
        ? "max-w-[1080px]"
        : "max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl",
    [isSidebarOpen],
  );

  const openCreateModal = useCallback(() => {
    if (!router || !pathname || !searchParams) return;
    const params = new URLSearchParams(searchParams);
    params.set("modal", "choose-mode");
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center gap-8 rounded-tl-3xl border-t border-l border-base-300 bg-base-100 pb-12 pt-4 sm:gap-10 sm:pb-16 sm:pt-6 md:gap-12 md:pb-20 md:pt-8"
      data-tour="home-content"
    >
      <HeroSection
        sectionMaxWidth={sectionMaxWidth}
        onCreateClick={openCreateModal}
      />
      <ValueSection sectionMaxWidth={sectionMaxWidth} />
      <StackSection sectionMaxWidth={sectionMaxWidth} />
      <QuickLinksSection sectionMaxWidth={sectionMaxWidth} />
      <DeveloperCard sectionMaxWidth={sectionMaxWidth} />
      <footer className="mt-auto flex flex-col items-center gap-2 border-t border-base-content/10 pt-4 text-center text-sm text-base-content/60">
        <div>
          {APP_CONFIG.version} © {APP_CONFIG.year} {APP_CONFIG.name}
        </div>
      </footer>
    </section>
  );
}
