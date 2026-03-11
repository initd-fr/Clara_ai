"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Brain,
  Server,
  Settings,
  Database,
} from "lucide-react";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

// Mapping des icônes pour chaque tab
const tabIcons = {
  llm: Brain,
  providers: Server,
  settings: Settings,
  backup: Database,
} as const;
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
export const Tabs = memo(({ tabs, activeTab, onChange }: TabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const handleTabClick = useCallback(
    (tabId: string) => {
      onChange(tabId);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, tabId: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(tabId);
      }
    },
    [onChange],
  );

  // Handle wheel scroll (inverted)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (scrollContainerRef.current) {
      const delta = e.deltaY;
      if (delta > 0) {
        // Scroll down = go right
        scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
      } else {
        // Scroll up = go left
        scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
      }
    }
  }, []);

  // Add wheel scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  // Mémoisation des classes CSS
  const containerClasses = useMemo(
    () => "sticky top-0 z-10 w-full bg-gradient-to-br from-[#25f5ef]/5 via-[#931975]/10 to-[#580744]/15",
    [],
  );

  // ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className={containerClasses}>
      {/* Navigation Tabs - Style cohérent avec l'app */}
      <div className="flex items-center justify-center">
        {/* Container principal */}
        <div className="w-1.5/3 relative max-w-4xl overflow-visible">
          {/* Background avec gradient Clara subtil */}

          {/* Navigation scrollable */}
          <div
            ref={scrollContainerRef}
            className="flex items-center justify-around gap-5 px-6 py-4"
            role="tablist"
            aria-label="Navigation par onglets"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tabIcons[tab.id as keyof typeof tabIcons];

              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`group relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "z-20 scale-110 bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg ring-2 ring-primary/30"
                        : "bg-gradient-to-br from-base-100 to-neutral text-base-content shadow-md hover:scale-[1.02] hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 hover:shadow-xl active:scale-100"
                    }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {/* Icône */}
                    {IconComponent && (
                      <IconComponent
                        className={`h-7 w-7 ${isActive ? "text-primary" : "text-base-content/70"}`}
                      />
                    )}
                    {/* Effet shimmer au hover */}
                    {!isActive && (
                      <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Tooltip custom */}
                  {hoveredTab === tab.id && (
                    <div className="pointer-events-none absolute -bottom-10 left-1/2 z-[100] -translate-x-1/2 transform whitespace-nowrap rounded-lg bg-base-content px-3 py-2 text-xs font-medium text-base-100 shadow-xl">
                      {tab.label}
                      {/* Flèche du tooltip */}
                      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-base-content"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
  // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
});

Tabs.displayName = "Tabs";
