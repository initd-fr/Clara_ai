"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { Copy, CheckCircle, Code, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useCallback, useMemo, memo } from "react";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface Placeholder {
  placeholder: string;
  description: string;
}

interface PlaceholderCardProps {
  item: Placeholder;
  copiedId: string | null;
  onCopy: (text: string) => void;
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const PLACEHOLDERS: Placeholder[] = [
  {
    placeholder: "{modelPrompt}",
    description: "Le prompt utilisé pour interagir avec le modèle.",
  },
  {
    placeholder: "{lastExchange}",
    description: "La dernière interaction entre l'utilisateur et le modèle.",
  },
  {
    placeholder: "{rag}",
    description: "Documents RAG pertinents pour la question.",
  },
  {
    placeholder: "{temporaryDocumentContext}",
    description: "Un document temporaire ajouté au contexte.",
  },
  {
    placeholder: "{webSearch}",
    description: "Résultats de la recherche web.",
  },
  {
    placeholder: "{question}",
    description: "La question posée par l'utilisateur.",
  },
  {
    placeholder: "{crlf}",
    description: "Un retour à la ligne \\n.",
  },
  {
    placeholder: "{modelName}",
    description: "Le nom du modèle donner par le user.",
  },
  {
    placeholder: "{userName}",
    description: "Le nom de l'utilisateur qui a cree le model.",
  },
];

// Composant mémoïsé pour la carte de placeholder
const PlaceholderCard = memo(
  ({ item, copiedId, onCopy }: PlaceholderCardProps) => {
    const handleClick = useCallback(() => {
      onCopy(item.placeholder);
    }, [item.placeholder, onCopy]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCopy(item.placeholder);
        }
      },
      [item.placeholder, onCopy],
    );

    // Mémoisation des classes CSS
    const cardClasses = useMemo(
      () =>
        "group relative overflow-hidden rounded-xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      [],
    );

    const codeClasses = useMemo(
      () =>
        "block font-mono font-bold text-lg text-primary group-hover:text-primary/80",
      [],
    );

    const buttonClasses = useMemo(
      () =>
        "group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-base-200/50 to-base-100 p-2 text-base-content/70 transition-all hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md",
      [],
    );

    const iconClasses = useMemo(
      () =>
        "h-4 w-4 text-base-content/70 transition-all group-hover/btn:text-primary",
      [],
    );

    const descriptionClasses = useMemo(
      () => "mt-3 line-clamp-2 text-sm text-base-content/70",
      [],
    );

    const progressBarClasses = useMemo(
      () =>
        "absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary/50 to-secondary/50 transition-transform group-hover:scale-x-100",
      [],
    );

    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <div
        className={cardClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Copier ${item.placeholder}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <code className={codeClasses}>{item.placeholder}</code>
          </div>
          <button
            className={buttonClasses}
            aria-label="Copier"
            aria-hidden="true"
          >
            <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover/btn:translate-x-full group-hover/btn:opacity-100" />
            {copiedId === item.placeholder ? (
              <CheckCircle
                className="relative z-10 h-4 w-4 text-success"
                aria-hidden="true"
              />
            ) : (
              <Copy
                className={`relative z-10 ${iconClasses}`}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
        <p className={descriptionClasses}>{item.description}</p>
        <div className={progressBarClasses} />
      </div>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);

PlaceholderCard.displayName = "PlaceholderCard";

export const PlaceholdersList = memo(() => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success("Copié !");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie");
    }
  }, []);

  // Mémoisation des classes CSS
  const containerClasses = useMemo(
    () =>
      "relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-8 shadow-lg backdrop-blur-sm",
    [],
  );

  const headerClasses = useMemo(
    () => "mb-8 flex items-center justify-between",
    [],
  );

  const titleClasses = useMemo(
    () => "text-2xl font-bold text-base-content",
    [],
  );

  const subtitleClasses = useMemo(() => "text-base text-base-content/70", []);

  const gridClasses = useMemo(
    () => "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
    [],
  );

  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div
      className={containerClasses}
      role="region"
      aria-labelledby="placeholders-title"
    >
      {/* Élément décoratif */}
      <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-xl" />

      <div className={headerClasses}>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 id="placeholders-title" className={titleClasses}>
              Variables Disponibles
            </h2>
            <div className={subtitleClasses}>
              Cliquez sur une variable pour la copier
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-base-content">
            {PLACEHOLDERS.length} variables
          </span>
        </div>
      </div>
      <div
        className={gridClasses}
        role="list"
        aria-label="Liste des variables disponibles"
      >
        {PLACEHOLDERS.map((item) => (
          <PlaceholderCard
            key={item.placeholder}
            item={item}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  );
  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
});

PlaceholdersList.displayName = "PlaceholdersList";
