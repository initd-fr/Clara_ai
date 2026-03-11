"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useState, useMemo, useCallback, memo } from "react";
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import type { Setting } from "~/types/support";
import { api } from "~/trpc/react";
import { Settings, Save, RotateCcw } from "lucide-react";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface SettingsListProps {
  groupedSettings: Record<string, Setting[]>;
  onRefresh: () => void;
}

interface SettingRowProps {
  setting: Setting;
  onRefresh: () => void;
}

interface Placeholder {
  placeholder: string;
  description: string;
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
// Ajouter la définition des placeholders
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

const placeholderRegex = /\{[^}]+\}/g;

// Mapping des noms de catégories connus
const CATEGORY_NAMES: Record<string, string> = {
  "9": "Paramètres accès",
  "100": "Prompts de Configuration",
  "101": "Accès",
} as const;

const PROMPTS_CATEGORY_NAME =
  CATEGORY_NAMES["100"] ?? "Prompts de Configuration";

// Composant mémoïsé pour la ligne de paramètre
const SettingRow = memo(({ setting, onRefresh }: SettingRowProps) => {
  const [editedValue, setEditedValue] = useState(setting.value);
  const [isModified, setIsModified] = useState(false);

  const updateSetting = api.settings.update.useMutation({
    onSuccess: () => {
      setIsModified(false);
      onRefresh();
    },
  });

  const generateHighlightRules = useCallback(() => {
    const placeholdersInText = editedValue.match(placeholderRegex) || [];
    const validPlaceholders = placeholdersInText.filter((ph) =>
      PLACEHOLDERS.some((placeholder) => placeholder.placeholder === ph),
    );
    const invalidPlaceholders = placeholdersInText.filter(
      (ph) =>
        !PLACEHOLDERS.some((placeholder) => placeholder.placeholder === ph),
    );

    return [
      ...validPlaceholders.map((placeholder) => ({
        highlight: placeholder,
        className: "bg-success/20 text-success font-medium",
      })),
      ...invalidPlaceholders.map((placeholder) => ({
        highlight: placeholder,
        className: "bg-error/20 text-error font-medium",
      })),
    ];
  }, [editedValue]);

  const handleValueChange = useCallback(
    (value: string) => {
      setEditedValue(value);
      setIsModified(value !== setting.value);
    },
    [setting.value],
  );

  const handleReset = useCallback(() => {
    setEditedValue(setting.value);
    setIsModified(false);
  }, [setting.value]);

  const handleSave = useCallback(() => {
    updateSetting.mutate({
      key: setting.key,
      value: editedValue,
    });
  }, [editedValue, setting.key, updateSetting]);

  // Formatter la clé pour une meilleure lisibilité
  const formattedKey = useMemo(
    () =>
      setting.key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    [setting.key],
  );

  // Mémoisation des classes CSS
  const containerClasses = useMemo(
    () =>
      "group relative overflow-hidden rounded-xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-6 shadow-lg transition-all hover:shadow-xl hover:border-primary/30",
    [],
  );

  const gridClasses = useMemo(
    () => "grid grid-cols-1 gap-6 lg:grid-cols-3",
    [],
  );

  const keyContainerClasses = useMemo(() => "flex flex-col justify-start", []);

  const keyBoxClasses = useMemo(
    () =>
      "mb-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 ring-1 ring-primary/20",
    [],
  );

  const keyTitleClasses = useMemo(
    () => "break-words font-bold text-base-content",
    [],
  );

  const toolTypeClasses = useMemo(
    () => "mt-2 text-sm text-base-content/60",
    [],
  );

  const textareaContainerClasses = useMemo(
    () =>
      `flex-1 rounded-xl transition-all ${
        isModified
          ? "border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border border-base-300/50 hover:border-primary/30"
      }`,
    [isModified],
  );

  const textareaContentClasses = useMemo(() => "p-4 text-base-content", []);

  const buttonsContainerClasses = useMemo(() => "flex flex-col gap-2", []);

  const cancelButtonClasses = useMemo(
    () =>
      "group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-base-200/50 to-base-100 p-2 text-base-content/70 transition-all hover:from-error/20 hover:to-error/10 hover:text-error hover:shadow-md",
    [],
  );

  const saveButtonClasses = useMemo(
    () =>
      "group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-base-200/50 to-base-100 p-2 text-base-content/70 transition-all hover:from-success/20 hover:to-success/10 hover:text-success hover:shadow-md",
    [],
  );

  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className={containerClasses}>
      <div className={gridClasses}>
        <div className={keyContainerClasses}>
          <div className={keyBoxClasses}>
            <h4 className={keyTitleClasses}>{formattedKey}</h4>
          </div>
          {setting.toolType && (
            <p className={toolTypeClasses}>{setting.toolType}</p>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className={textareaContainerClasses}>
              <div className={textareaContentClasses}>
                <HighlightWithinTextarea
                  value={editedValue}
                  highlight={generateHighlightRules()}
                  onChange={handleValueChange}
                  aria-label={`Modifier ${formattedKey}`}
                />
              </div>
            </div>
            {isModified && (
              <div className={buttonsContainerClasses}>
                <button
                  className={cancelButtonClasses}
                  onClick={handleReset}
                  disabled={updateSetting.isPending}
                  aria-label="Annuler les modifications"
                >
                  <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover/btn:translate-x-full group-hover/btn:opacity-100" />
                  <RotateCcw className="relative z-10 h-4 w-4" />
                </button>
                <button
                  className={saveButtonClasses}
                  onClick={handleSave}
                  disabled={updateSetting.isPending}
                  aria-label="Sauvegarder les modifications"
                >
                  <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover/btn:translate-x-full group-hover/btn:opacity-100" />
                  <Save className="relative z-10 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
});

SettingRow.displayName = "SettingRow";

export const SettingsList = memo(
  ({ groupedSettings, onRefresh }: SettingsListProps) => {
    // Regrouper les paramètres de manière plus logique
    const reorganizedSettings = useMemo(() => {
      const newGroups: Record<string, Setting[]> = {};
      const promptsKeys = [
        "LLM_SystemPrompt_Agent",
        "LLM_SystemPrompt_Expert",
        "LLM_SystemPrompt_Web",
      ];

      // On place tous les prompts dans la bonne catégorie
      Object.values(groupedSettings).forEach((settings) => {
        settings.forEach((setting) => {
          if (promptsKeys.includes(setting.key)) {
            if (!newGroups[PROMPTS_CATEGORY_NAME]) {
              newGroups[PROMPTS_CATEGORY_NAME] = [];
            }
            newGroups[PROMPTS_CATEGORY_NAME]!.push(setting);
          } else {
            const catKey: string = String(setting.categoryId ?? "");
            const catName: string =
              catKey in CATEGORY_NAMES
                ? (CATEGORY_NAMES[catKey as keyof typeof CATEGORY_NAMES] ??
                  "Autres")
                : "Autres";
            if (!newGroups[catName]) {
              newGroups[catName] = [];
            }
            newGroups[catName]!.push(setting);
          }
        });
      });

      // Trier les prompts dans l'ordre souhaité
      if (newGroups[PROMPTS_CATEGORY_NAME]) {
        newGroups[PROMPTS_CATEGORY_NAME]!.sort((a: Setting, b: Setting) => {
          const order: Record<string, number> = {
            LLM_SystemPrompt_Agent: 1,
            LLM_SystemPrompt_Expert: 2,
            LLM_SystemPrompt_Web: 3,
          };
          return (order[a.key] || 999) - (order[b.key] || 999);
        });
      }
      return newGroups;
    }, [groupedSettings]);

    // Mémoisation des classes CSS
    const containerClasses = useMemo(() => "space-y-8", []);

    const categoryContainerClasses = useMemo(
      () =>
        "relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 shadow-lg",
      [],
    );

    const categoryHeaderClasses = useMemo(
      () =>
        "relative overflow-hidden border-b border-base-300/50 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 px-8 py-6",
      [],
    );

    const categoryTitleClasses = useMemo(
      () => "text-xl font-bold text-base-content",
      [],
    );

    const categoryContentClasses = useMemo(() => "space-y-6 p-6", []);

    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <div
        className={containerClasses}
        role="region"
        aria-label="Liste des paramètres système"
      >
        {Object.entries(reorganizedSettings).map(([category, settings]) => (
          <div key={category} className={categoryContainerClasses}>
            {/* Élément décoratif */}
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-xl" />

            <div className={categoryHeaderClasses}>
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className={categoryTitleClasses}>{category}</h3>
                  <p className="text-sm text-base-content/70">
                    {settings.length} paramètre{settings.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={categoryContentClasses}
              role="list"
              aria-label={`Paramètres de ${category}`}
            >
              {settings.map((setting) => (
                <SettingRow
                  key={setting.key}
                  setting={setting}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);
// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
SettingsList.displayName = "SettingsList";
