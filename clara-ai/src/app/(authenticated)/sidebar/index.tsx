"use client";

//~ ////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { Suspense, lazy, memo, useMemo, useCallback } from "react";
import { Dock } from "./elements/dock";
import { SidebarScroll } from "./elements/SidebarScroll";
import { LoadingSkeleton } from "./elements/ModelsList";
import {
  Sidebar as AceternitySidebar,
  SidebarBody,
  DesktopSidebar,
  MobileSidebar,
  useSidebar as useAceternitySidebar,
} from "~/components/Aceternity/sidebar";
import { motion } from "motion/react";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { useSidebar } from "~/components/SidebarProvider";
import { api } from "~/trpc/react";
//~ ////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ? Chargement dynamique des composants avec preload
const ModelsList = lazy(() => import("./elements/ModelsList"));
const TopNavigation = lazy(() => import("./elements/TopNavigation"));
const UserDataSection = lazy(() => import("./elements/UserDataSection"));

const TopNavigationFallback = memo(() => (
  <div className="flex justify-around gap-2 px-2">
    <div className="h-10 w-32 animate-pulse rounded-full bg-base-300/50" />
    <div className="h-10 w-32 animate-pulse rounded-full bg-base-300/30 opacity-50" />
  </div>
));

TopNavigationFallback.displayName = "TopNavigationFallback";

// Logo optimisé avec memo et useMemo pour les animations
const LogoSidebar = memo(
  ({
    open,
    locked, // eslint-disable-line @typescript-eslint/no-unused-vars
    setLocked, // eslint-disable-line @typescript-eslint/no-unused-vars
    setOpen, // eslint-disable-line @typescript-eslint/no-unused-vars
  }: {
    open: boolean;
    locked: boolean;
    setLocked: (v: boolean) => void;
    setOpen?: (v: boolean) => void;
  }) => {
    // Optimisation des animations avec useMemo
    const letterAnimations = useMemo(
      () => [
        { delay: 0.1, letter: "l", key: "l" },
        { delay: 0.2, letter: "a", key: "a1" },
        { delay: 0.3, letter: "r", key: "r" },
        { delay: 0.4, letter: "a", key: "a2" },
      ],
      [],
    );

    return (
      <>
        <Link href="/">
          <div className="flex flex-col items-center" data-tour="logo-clara">
            <div className="relative mt-4 flex h-[80px] w-full flex-row items-center justify-center">
              <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
                className="shrink-0"
              >
                <defs>
                  <linearGradient
                    id="sidebar-c-gradient"
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
                  stroke="url(#sidebar-c-gradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              {open ? (
                <>
                  <div className="logo-gradient-wa -ml-2 mt-1 flex flex-row items-center gap-0">
                    {letterAnimations.map(({ delay, letter, key }) => (
                      <motion.span
                        key={key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay }}
                        className="bg-clip-text text-5xl font-normal text-transparent"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </div>
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: 10 }}
                    transition={{
                      type: "spring",
                      stiffness: 80,
                      damping: 18,
                      duration: 0.6,
                    }}
                    className="-ml-1 mt-3 text-4xl font-medium text-gray-400"
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      letterSpacing: 2,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    AI
                  </motion.span>
                </>
              ) : (
                <span
                  style={{
                    position: "absolute",
                    left: "70%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: "bold",
                    fontSize: 20,
                    color: "#A0A0A0",
                    letterSpacing: 2,
                    lineHeight: 1,
                  }}
                >
                  AI
                </span>
              )}
            </div>
            {/* Ligne drapeau français animée EN DESSOUS du logo Clara AI */}
            {open && (
              <motion.div
                className="mx-auto mb-3 h-1 w-48 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  background:
                    "linear-gradient(90deg, #0055A4 0%, #0055A4 33.33%, #fff 33.33%, #fff 66.66%, #EF4135 66.66%, #EF4135 100%)",
                  originX: 0.5,
                }}
              />
            )}
          </div>
        </Link>
      </>
    );
  },
);

LogoSidebar.displayName = "LogoSidebar";

// Hook pour déterminer le type d'abonnement
const useSubscriptionType = () => {
  const { data: subscriptionInfo } = api.user.getSubscriptionInfo.useQuery();

  // Déterminer les permissions selon l'abonnement
  const canCreatePersonalModels =
    subscriptionInfo?.canCreatePersonalModels ?? false;
  const canAccessStoreModels = subscriptionInfo?.canAccessStoreModels ?? false;

  return {
    canCreatePersonalModels,
    canAccessStoreModels,
    isLoading: !subscriptionInfo,
  };
};

// SidebarContent optimisé avec useCallback et chargement conditionnel
const SidebarContent = memo(
  ({ locked, onLockToggle }: { locked: boolean; onLockToggle: () => void }) => {
    const { open, setOpen } = useAceternitySidebar();
    const { isLoading } = useSubscriptionType();

    // Gestion du verrouillage avec ouverture forcée optimisée
    const handleLockToggle = useCallback(() => {
      if (!locked) {
        // Verrouiller : forcer l'ouverture et activer le verrou
        setOpen(true);
      }
      onLockToggle();
    }, [locked, setOpen, onLockToggle]);

    return (
      <>
        <DesktopSidebar
          className="hidden h-full w-[300px] shrink-0 border-r border-base-200 bg-base-200 dark:border-base-300 lg:flex lg:flex-col xl:w-[320px]"
          locked={locked}
        >
          {open ? (
            <div className="flex h-full flex-col">
              {/* Logo/Header + bouton lock */}
              <div className="relative">
                <LogoSidebar
                  open={open}
                  locked={locked}
                  setLocked={onLockToggle}
                  setOpen={setOpen}
                />
                <button
                  className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full p-1 transition hover:bg-base-300"
                  title={
                    locked
                      ? "Déverrouiller la sidebar"
                      : "Verrouiller la sidebar"
                  }
                  onClick={handleLockToggle}
                  type="button"
                  data-tour="sidebar-toggle"
                >
                  {locked ? (
                    <Lock size={18} className="text-error" />
                  ) : (
                    <Unlock size={18} className="text-success" />
                  )}
                </button>
              </div>
              {/* Navigation conditionnelle */}
              <div className="mt-3 shrink-0 px-4">
                <Suspense fallback={<TopNavigationFallback />}>
                  <TopNavigation />
                </Suspense>
              </div>

              {/* Zone scrollable conditionnelle */}
              <div className="mt-5 flex flex-1 flex-col overflow-y-auto">
                <SidebarScroll>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <Suspense fallback={<LoadingSkeleton />}>
                      <ModelsList />
                    </Suspense>
                  )}
                </SidebarScroll>
              </div>
              {/* Footer conditionnel */}
              <div className="mt-auto">
                <div className="bg-glass border-t border-neutral/20 p-4">
                  {isLoading ? (
                    <section className="relative w-full">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
                      <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-3 p-3">
                          <div className="avatar shrink-0">
                            <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 h-4 w-24 animate-pulse rounded bg-base-300/80" />
                            <div className="h-4 w-16 animate-pulse rounded bg-base-200/80" />
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-white/10 p-3">
                          <div className="h-3 w-32 animate-pulse rounded bg-base-300/60" />
                          <div className="h-3 w-40 animate-pulse rounded bg-base-200/60" />
                        </div>
                      </div>
                    </section>
                  ) : (
                    <Suspense
                      fallback={
                        <section className="relative w-full">
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
                          <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 p-3">
                              <div className="avatar shrink-0">
                                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 h-4 w-24 animate-pulse rounded bg-base-300/80" />
                                <div className="h-4 w-16 animate-pulse rounded bg-base-200/80" />
                              </div>
                            </div>
                            <div className="space-y-2 border-t border-white/10 p-3">
                              <div className="h-3 w-32 animate-pulse rounded bg-base-300/60" />
                              <div className="h-3 w-40 animate-pulse rounded bg-base-200/60" />
                            </div>
                          </div>
                        </section>
                      }
                    >
                      <UserDataSection />
                    </Suspense>
                  )}
                </div>

                <div className="bg-glass p-2">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center gap-6 rounded-xl bg-base-200/50 p-2 backdrop-blur-md">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-11 w-11 animate-pulse rounded-lg bg-base-300/50"
                          />
                        ))}
                      </div>
                    }
                  >
                    <Dock className="mx-auto" />
                  </Suspense>
                </div>
              </div>
            </div>
          ) : (
            // Design mini sidebar fermée (grand logo C + AI)
            <LogoSidebar open={open} locked={locked} setLocked={onLockToggle} />
          )}
        </DesktopSidebar>
        <MobileSidebar>
          {/* Pour mobile, on affiche toujours le contenu complet */}
          <div className="flex h-full flex-col space-y-6">
            {/* Logo/Header */}
            <div className="flex flex-row items-center justify-center">
              <span className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-medium text-transparent">
                  C
                </span>
                <span className="font-medium text-gray-400">l</span>
                <span className="font-medium text-gray-400">a</span>
                <span className="font-medium text-gray-400">r</span>
                <span className="font-medium text-gray-400">a</span>
              </span>
              <span className="text-2xl font-bold">
                <span className="ml-2 bg-base-content bg-clip-text text-xl font-normal text-transparent">
                  AI
                </span>
              </span>
            </div>
            {/* Navigation */}
            <div className="shrink-0 px-4">
              <Suspense fallback={<TopNavigationFallback />}>
                <TopNavigation />
              </Suspense>
            </div>
            {/* Zone scrollable conditionnelle */}
            <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
              <SidebarScroll>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <Suspense fallback={<LoadingSkeleton />}>
                    <ModelsList />
                  </Suspense>
                )}
              </SidebarScroll>
            </div>
            {/* Footer conditionnel */}
            <div className="mt-auto">
              <div className="bg-glass border-t border-neutral/20 p-4">
                {isLoading ? (
                  <section className="relative w-full">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
                    <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
                      <div className="flex items-center gap-3 p-3">
                        <div className="avatar shrink-0">
                          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 h-4 w-24 animate-pulse rounded bg-base-300/80" />
                          <div className="h-4 w-16 animate-pulse rounded bg-base-200/80" />
                        </div>
                      </div>
                      <div className="space-y-2 border-t border-white/10 p-3">
                        <div className="h-3 w-32 animate-pulse rounded bg-base-300/60" />
                        <div className="h-3 w-40 animate-pulse rounded bg-base-200/60" />
                      </div>
                    </div>
                  </section>
                ) : (
                  <Suspense
                    fallback={
                      <section className="relative w-full">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
                        <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
                          <div className="flex items-center gap-3 p-3">
                            <div className="avatar shrink-0">
                              <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 h-4 w-24 animate-pulse rounded bg-base-300/80" />
                              <div className="h-4 w-16 animate-pulse rounded bg-base-200/80" />
                            </div>
                          </div>
                          <div className="space-y-2 border-t border-white/10 p-3">
                            <div className="h-3 w-32 animate-pulse rounded bg-base-300/60" />
                            <div className="h-3 w-40 animate-pulse rounded bg-base-200/60" />
                          </div>
                        </div>
                      </section>
                    }
                  >
                    <UserDataSection />
                  </Suspense>
                )}
              </div>

              <div className="bg-glass p-2">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center gap-6 rounded-xl bg-base-200/50 p-2 backdrop-blur-md">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-11 w-11 animate-pulse rounded-lg bg-base-300/50"
                        />
                      ))}
                    </div>
                  }
                >
                  <Dock className="mx-auto" />
                </Suspense>
              </div>
            </div>
          </div>
        </MobileSidebar>
      </>
    );
  },
);

SidebarContent.displayName = "SidebarContent";

// Composant principal optimisé
const Sidebar = memo(() => {
  const { isLocked, setIsLocked, isOpen, setIsOpen } = useSidebar();

  // Gestion du verrouillage optimisée
  const handleLockToggle = useCallback(() => {
    setIsLocked(!isLocked);
  }, [isLocked, setIsLocked]);

  return (
    <AceternitySidebar open={isOpen} setOpen={setIsOpen}>
      <SidebarBody locked={isLocked} data-tour="sidebar">
        <SidebarContent locked={isLocked} onLockToggle={handleLockToggle} />
      </SidebarBody>
    </AceternitySidebar>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
