"use client";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { api } from "~/trpc/react";
import { PlaceholdersList } from "../components/PlaceholdersList";
import { SettingsList } from "../components/SettingsList";
import SecondaryLoader from "~/components/SecondaryLoader";
import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import type { Setting } from "~/types/support";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

export function SystemSettingsSection() {
  ////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const {
    data: rawSettings,
    isLoading,
    error,
    refetch,
  } = api.settings.getAll.useQuery();

  /////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  const groupedSettings: Record<string, Setting[]> | undefined = rawSettings
    ? Object.fromEntries(
        Object.entries(rawSettings).map(([category, settings]) => [
          category,
          settings.map((setting) => ({
            ...setting,
            categoryId:
              typeof setting.categoryId !== "undefined"
                ? setting.categoryId
                : null,
          })),
        ]),
      )
    : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-base-300/50 bg-gradient-to-br from-base-100/50 to-base-200/30 py-16">
          <SecondaryLoader size="lg" />
          <p className="mt-4 text-lg text-base-content/70">
            Chargement des paramètres système...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-8 shadow-lg">
          {/* Élément décoratif */}
          <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-error/20 to-red-500/20 opacity-50 blur-xl" />

          <div
            className="relative z-10 text-center"
            role="alert"
            aria-live="polite"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-error/20 to-error/10">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-error">
              Erreur de chargement
            </h3>
            <p className="mb-6 text-base text-base-content/70">
              {error.message}
            </p>
            <button
              type="button"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-error/20 to-error/10 px-6 py-3 text-error ring-1 ring-error/20 transition-all hover:from-error/30 hover:to-error/20 hover:shadow-lg"
              onClick={() => refetch()}
              aria-label="Réessayer le chargement des paramètres"
            >
              <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
              <div className="relative z-10 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">Réessayer</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!groupedSettings) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="relative overflow-hidden rounded-2xl border border-base-300/50 bg-gradient-to-br from-base-100/80 to-base-200/50 p-8 shadow-lg">
          {/* Élément décoratif */}
          <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-warning/20 to-yellow-500/20 opacity-50 blur-xl" />

          <div
            className="relative z-10 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warning/20 to-warning/10">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-warning">
              Aucune donnée
            </h3>
            <p className="text-base text-base-content/70">
              Aucun paramètre système n&apos;a été trouvé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-8">
      {/* Header moderne avec gradient Clara */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-8">
        {/* Éléments décoratifs */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl" />
        <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-gradient-to-tr from-accent/40 to-primary/40 blur-lg" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-base-content">
                Paramètres Système
              </h2>
              <p className="text-lg text-base-content/70">
                Gérez les configurations et variables du système
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-base-content">
                Configuration avancée
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-base-100/50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-sm font-medium text-base-content">
                Variables dynamiques
              </span>
            </div>
          </div>
        </div>
      </div>

      <PlaceholdersList />
      <SettingsList
        groupedSettings={groupedSettings}
        onRefresh={() => refetch()}
      />
    </div>
  );
}
////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
