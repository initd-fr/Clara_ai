"use client";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useCallback } from "react";
import { cn } from "~/lib/utils";
import { Plus } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useClientSide } from "~/hooks/useClientSide";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
export type SelectModalProps = {
  type: "solo" | "team";
  mode: "agent" | "expert";
  creation: "quick" | "advanced";
};
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TODO CREATE BUTTON///////////////////////////////////////////////////////////////////////////////////////
const CreateButton = memo(
  ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      data-tour="create-button"
      className={cn(
        "group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-base-100 to-neutral px-4 py-2 font-semibold text-base-content shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-100",
      )}
    >
      <Plus className="mr-2 h-5 w-5" />
      <span className="text-base font-medium">Créer</span>
      <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
    </button>
  ),
);
//////////////////////////////////////////////////////////////////////////////////TODO END CREATE BUTTON///////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////TODO TOP NAVIGATION///////////////////////////////////////////////////////////////////////////////////////
const TopNavigation = memo(() => {
  const isClient = useClientSide();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openCreateModal = useCallback(() => {
    if (!isClient || !router || !pathname || !searchParams) return;
    const params = new URLSearchParams(searchParams);
    params.set("modal", "choose-mode");
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, isClient]);

  const shouldShowSkeleton = !isClient;

  if (shouldShowSkeleton) {
    return (
      <div className="flex justify-around px-2">
        <div className="h-10 w-full max-w-[120px] animate-pulse rounded-full bg-base-300/50" />
      </div>
    );
  }

  return (
    <div className="flex justify-around gap-2 px-2">
      <CreateButton onClick={openCreateModal} />
    </div>
  );
});
//////////////////////////////////////////////////////////////////////////////////TODO END TOP NAVIGATION///////////////////////////////////////////////////////////////////////////////////////

CreateButton.displayName = "CreateButton";
TopNavigation.displayName = "TopNavigation";

export default TopNavigation;
