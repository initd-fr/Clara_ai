"use client";

//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useCallback, memo } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import type { SimplifyType } from "../elements/ChatInput";
import { Rocket } from "lucide-react";
import { cn } from "~/lib/utils";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type SimplifyMenuProps = {
  onSimplify: (type: SimplifyType) => void;
  disabled?: boolean;
  className?: string;
};
//////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const SimplifyMenu = memo(
  ({ onSimplify, disabled, className }: SimplifyMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    //////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
    const handleSimplify = useCallback(
      (type: SimplifyType) => {
        onSimplify(type);
        setIsOpen(false);
      },
      [onSimplify],
    );

    //////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          data-tooltip-id="simplify-tooltip"
          data-tooltip-content="Reformuler le message"
          className={cn(
            "group relative flex items-center justify-center transition-all duration-300",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-primary/10 active:bg-primary/20",
            className,
          )}
        >
          <span className="absolute -inset-2 rounded-full bg-primary/0 opacity-0 blur transition-all duration-500 group-hover:bg-primary/10 group-hover:opacity-100"></span>
          <Rocket className="h-4 w-4" />
          <span className="sr-only">Reformuler le message</span>
        </button>
        <ReactTooltip id="simplify-tooltip" place="top" className="z-50" />

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/95 p-4 shadow-lg backdrop-blur-xl">
            <div className="max-h-[calc(100vh-200px)] overflow-auto">
              <div className="flex flex-col gap-4">
                {/* Style d'écriture */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Style d&apos;écriture
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("standard")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      Standard
                    </button>
                    <button
                      onClick={() => handleSimplify("formal")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Formel
                    </button>
                    <button
                      onClick={() => handleSimplify("casual")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Décontracté
                    </button>
                    <button
                      onClick={() => handleSimplify("professional")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Professionnel
                    </button>
                    <button
                      onClick={() => handleSimplify("academic")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      Académique
                    </button>
                  </div>
                </div>

                {/* Format */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Format
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("shorten")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Raccourci
                    </button>
                    <button
                      onClick={() => handleSimplify("lengthen")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Détaillé
                    </button>
                    <button
                      onClick={() => handleSimplify("keyPoints")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Points clés
                    </button>
                    <button
                      onClick={() => handleSimplify("bulletPoints")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      Points
                    </button>
                    <button
                      onClick={() => handleSimplify("paragraph")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h8"
                        />
                      </svg>
                      Paragraphes
                    </button>
                  </div>
                </div>

                {/* Ton */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Ton
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("simplified")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Simplifié
                    </button>
                    <button
                      onClick={() => handleSimplify("persuasive")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                        />
                      </svg>
                      Persuasif
                    </button>
                    <button
                      onClick={() => handleSimplify("neutral")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Neutre
                    </button>
                    <button
                      onClick={() => handleSimplify("emoji")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Avec Emoji
                    </button>
                    <button
                      onClick={() => handleSimplify("noEmoji")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Sans Emoji
                    </button>
                  </div>
                </div>

                {/* Public cible */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Public cible
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("children")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      Enfants
                    </button>
                    <button
                      onClick={() => handleSimplify("adolescent")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Adolescents
                    </button>
                    <button
                      onClick={() => handleSimplify("expert")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Expert
                    </button>
                  </div>
                </div>

                {/* Style créatif */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Style créatif
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("story")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      Narratif
                    </button>
                    <button
                      onClick={() => handleSimplify("poem")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      Poétique
                    </button>
                  </div>
                </div>

                {/* Réseaux sociaux */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Réseaux sociaux
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("tweet")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Tweet
                    </button>
                    <button
                      onClick={() => handleSimplify("thread")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7m14-5l-7 7-7-7"
                        />
                      </svg>
                      Thread
                    </button>
                    <button
                      onClick={() => handleSimplify("linkedin")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      LinkedIn
                    </button>
                  </div>
                </div>

                {/* Mise en forme */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Mise en forme
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("toBullets")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      Liste à puces
                    </button>
                    <button
                      onClick={() => handleSimplify("toNumberedList")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      Liste numérotée
                    </button>
                    <button
                      onClick={() => handleSimplify("toTable")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Tableau
                    </button>
                    <button
                      onClick={() => handleSimplify("toOutline")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Plan
                    </button>
                  </div>
                </div>

                {/* Contextes avancés */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                    Contextes avancés
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimplify("scientificSummary")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      Résumé scientifique
                    </button>
                    <button
                      onClick={() => handleSimplify("executiveSummary")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Résumé exécutif
                    </button>
                    <button
                      onClick={() => handleSimplify("debate")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Débat
                    </button>
                    <button
                      onClick={() => handleSimplify("counterArgument")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                      Contre-argument
                    </button>
                    <button
                      onClick={() => handleSimplify("questionGenerator")}
                      className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content transition-all duration-200 hover:bg-base-200"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Générateur de questions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

SimplifyMenu.displayName = "SimplifyMenu";

export default SimplifyMenu;
