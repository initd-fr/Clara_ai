"use client";

import { cn } from "~/lib/utils";
import React, { useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

// Fonction pour mapper les badges à leurs couleurs et labels français
const getBadgeConfig = (badge: string) => {
  switch (badge) {
    case "FEATURE":
      return {
        label: "Fonctionnalité",
        className: "badge-primary",
      };
    case "UPDATE":
      return {
        label: "Mise à jour",
        className: "badge-info",
      };
    case "MODEL":
      return {
        label: "Modèle",
        className: "badge-secondary",
      };
    case "MAINTENANCE":
      return {
        label: "Maintenance",
        className: "badge-warning",
      };
    case "PROMOTION":
      return {
        label: "Promotion",
        className: "badge-accent",
      };
    case "GENERAL":
      return {
        label: "Général",
        className: "badge-neutral",
      };
    default:
      return {
        label: badge,
        className: "badge-primary",
      };
  }
};

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  pauseOnHover = true,
  className,
}: {
  items: {
    title: string;
    badge:
      | "FEATURE"
      | "UPDATE"
      | "MODEL"
      | "MAINTENANCE"
      | "PROMOTION"
      | "GENERAL";
    content: string;
    date: string;
  }[];
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fonction addAnimation mémorisée avec useCallback
  // Vitesse unique, suffisamment lente pour la lecture confortable
  const duration = useMemo(() => "120s", []);

  const addAnimation = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty("--animation-duration", duration);
  }, [duration]);

  useEffect(() => {
    // Démarrer l'animation immédiatement et la laisser tourner en continu
    addAnimation();
  }, [addAnimation]);

  // Gérer intelligemment la duplication des items pour avoir exactement 4 cartes
  // 1 actu = 4 copies de la même actu
  // 2 actu = 2 copies de chaque actu
  // 3 actu = 3 actu + 1 copie de la première
  // 4+ actu = les 4 premières
  const getDuplicatedItems = () => {
    if (items.length === 0) return [];

    if (items.length === 1) {
      // Pour 1 actualité, on la duplique 4 fois pour avoir 4 cartes
      return Array(4).fill(items[0]);
    } else if (items.length === 2) {
      // Pour 2 actualités, on les duplique 2 fois chacune pour avoir 4 cartes
      return [...items, ...items];
    } else if (items.length === 3) {
      // Pour 3 actualités, on ajoute 1 copie de la première pour avoir 4 cartes
      return [...items, items[0]];
    } else {
      // Pour 4+ actualités, on prend les 4 premières
      return items.slice(0, 4);
    }
  };

  const duplicatedItems = getDuplicatedItems();
  const trackItems = [...duplicatedItems, ...duplicatedItems];

  return (
    <div
      ref={containerRef}
      className={cn("scroller relative z-20 w-full overflow-hidden", className)}
    >
      <div
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-2 py-4 sm:gap-3 md:gap-4",
          "[animation-iteration-count:infinite] [animation-name:marquee] [animation-timing-function:linear]",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{
          // applique directement la durée (et via CSS var pour cohérence)
          animationDuration: duration,
          animationDirection: direction === "right" ? "reverse" : "normal",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        {trackItems.map((item, idx) => {
          const badgeConfig = getBadgeConfig(item.badge);
          return (
            <div
              className="group relative min-h-[180px] w-[240px] max-w-full shrink-0 cursor-pointer overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl sm:min-h-[200px] sm:w-[280px] md:w-[320px] lg:w-[350px] xl:w-[380px]"
              key={`${item.title}-${idx}`}
            >
              {/* Header du post */}
              <div className="flex items-center justify-between p-3 pb-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="avatar placeholder">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 md:h-14 md:w-14 ${isDark ? "bg-base-100" : "bg-base-300"}`}
                    >
                      <Image
                        src="/LogoCai.png"
                        alt="Clara AI"
                        width={48}
                        height={48}
                        className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10 md:h-12 md:w-12"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-base-content sm:text-base md:text-lg">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        "badge text-xs font-medium",
                        badgeConfig.className,
                      )}
                    >
                      {badgeConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenu du post */}
              <div className="px-3 pb-2 sm:px-4 sm:pb-3">
                <p className="text-xs leading-relaxed text-base-content sm:text-sm">
                  {item.content}
                </p>
              </div>

              {/* Actions du post */}
              <div className="flex items-center justify-between px-3 pb-3 sm:px-4 sm:pb-4">
                <span className="text-xs text-base-content/50">
                  {item.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
