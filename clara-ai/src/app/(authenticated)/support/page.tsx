////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { LLMSection } from "./elements/LLMSection";
import { SystemSettingsSection } from "./elements/SystemSettingsSection";
import { Tabs } from "./components/Tabs";
import BackupRestore from "./elements/BackupRestore";
import ProviderManagement from "./elements/ProviderManagement";
import { useAppSession } from "~/context/SessionContext";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type TabType = "llm" | "settings" | "backup" | "providers";
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function SupportPage() {
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const { user } = useAppSession();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<TabType>("llm");

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType);
  }, []);

  const tabsList = useMemo(() => {
    const baseTabs: { id: TabType; label: string }[] = [
      { id: "llm", label: "LLM" },
    ];
    if (isAdmin) {
      baseTabs.push(
        { id: "providers", label: "Providers" },
        { id: "settings", label: "Paramètres" },
        { id: "backup", label: "Database" },
      );
    }
    return baseTabs;
  }, [isAdmin]);

  useEffect(() => {
    const validTabIds = tabsList.map((tab) => tab.id);
    if (!validTabIds.includes(activeTab)) {
      setActiveTab("llm");
    }
  }, [tabsList, activeTab]);

  const currentSection = useMemo(() => {
    switch (activeTab) {
      case "llm":
        return <LLMSection />;
      case "providers":
        return isAdmin ? <ProviderManagement /> : null;
      case "settings":
        return isAdmin ? <SystemSettingsSection /> : null;
      case "backup":
        return isAdmin ? <BackupRestore /> : null;
      default:
        return null;
    }
  }, [activeTab, isAdmin]);
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen">
      <div className="-py-6 rounded-tl-3xl bg-gradient-to-br from-[#25f5ef]/5 via-[#931975]/10 to-[#580744]/15">
        <div className="container mx-auto flex min-h-[120px] items-center justify-center">
          <Tabs
            tabs={tabsList}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">{currentSection}</div>
    </div>
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
