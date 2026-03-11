"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useState, useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import { LLMForm } from "../components/LLMForm";
import { LLMTable } from "../components/LLMTable";
import type { Provider, LLM } from "~/types/support";
import { Brain, Plus } from "lucide-react";
/////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const MemoizedLLMForm = memo(LLMForm);
const MemoizedLLMTable = memo(LLMTable);

MemoizedLLMForm.displayName = "MemoizedLLMForm";
MemoizedLLMTable.displayName = "MemoizedLLMTable";

export function LLMSection() {
  const [selectedLLM, setSelectedLLM] = useState<LLM | null>(null);
  const { data: modelsData, refetch } = api.availableModels.getAll.useQuery();
  const canManageLLMs = true;

  const providers: Provider[] = useMemo(
    () =>
      modelsData
        ? Object.keys(modelsData)
            .filter((key) => modelsData[key]?.providerEnabled)
            .map((key) => ({
              value: key,
              label: modelsData[key]?.providerLabel ?? "",
              enabled: modelsData[key]?.providerEnabled ?? false,
            }))
        : [],
    [modelsData],
  );

  const llms: LLM[] = useMemo(
    () =>
      modelsData
        ? Object.entries(modelsData).flatMap(([key, provider]) => {
            const sortedModels = [...(provider?.models ?? [])].sort((a, b) =>
              a.llmValue.localeCompare(b.llmValue),
            );
            return sortedModels.map((llm) => ({
              llmId: llm.llmId,
              llmValue: llm.llmValue,
              llmLabel: llm.llmLabel,
              llmText: llm.llmText,
              llmClassName: llm.llmClassName,
              llmEnabled: llm.llmEnabled,
              llmIsDefault: llm.llmIsDefault ?? false,
              llmMaxInputTokens: llm.llmMaxInputTokens,
              llmMaxOutputTokens: llm.llmMaxOutputTokens,
              provider: key,
              description: llm.llmDescription ?? "",
            }));
          })
        : [],
    [modelsData],
  );
  /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
  const handleLLMSelect = useCallback((llm: LLM) => {
    setSelectedLLM(llm);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
    setSelectedLLM(null);
  }, [refetch]);

  const handleCancel = useCallback(() => {
    setSelectedLLM(null);
  }, []);
  /////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

  //  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-8">
      {/* Header moderne avec gradient Clara */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#25f5ef]/10 via-[#931975]/20 to-[#580744]/30 p-8 py-12 shadow-lg dark:from-[#25f5ef]/5 dark:via-[#931975]/10 dark:to-[#580744]/20">
        {/* Éléments décoratifs */}
        <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-15">
          <div className="absolute left-[5%] top-[10%] h-16 w-16 rounded-full bg-[#25f5ef] blur-xl"></div>
          <div className="absolute right-[15%] top-[30%] h-24 w-24 rounded-full bg-[#931975] blur-xl"></div>
          <div className="absolute bottom-[20%] left-[25%] h-20 w-20 rounded-full bg-[#580744] blur-xl"></div>
          <div className="absolute bottom-[10%] right-[10%] h-12 w-12 rounded-full bg-[#125eb4] blur-xl"></div>
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25f5ef]/20 to-[#931975]/20 shadow-lg">
              <Brain className="h-6 w-6 text-base-content" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">
                Gestion des Modèles LLM
              </h2>
              <p className="text-base-content/70">
                Configurez et gérez les modèles de langage
              </p>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {llms.length}
              </div>
              <div className="text-sm text-base-content/60">Modèles total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {llms.filter((l) => l.llmEnabled).length}
              </div>
              <div className="text-sm text-base-content/60">Actifs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {llms.filter((l) => l.llmIsDefault).length}
              </div>
              <div className="text-sm text-base-content/60">Par défaut</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire moderne */}
      {canManageLLMs && (
        <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/50 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#25f5ef]/20 to-[#931975]/20">
              <Plus className="h-4 w-4 text-base-content" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content">
                {selectedLLM ? "Modifier le modèle" : "Ajouter un nouveau modèle"}
              </h3>
            </div>
          </div>
          <MemoizedLLMForm
            providers={providers}
            onSuccess={handleFormSuccess}
            selectedLLM={selectedLLM}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Tableau des LLMs */}
      <MemoizedLLMTable
        providers={providers}
        llms={llms}
        onRefresh={refetch}
        onSelect={handleLLMSelect}
      />
    </div>
    //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
