"use client";

////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useCallback, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import SetModelModal from "./sidebar/components/SetModelModal";
import SpeedCreateModal from "./sidebar/components/SpeedCreateModal";
import ChooseModeModal from "./sidebar/components/ChooseModeModal";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
export type SelectModalProps = {
  type: "personal" | "clara";
  mode: "agent" | "expert";
  creation: "quick" | "advanced";
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
const ModalSelector = memo(function ModalSelector({
  modalType,
  searchParams,
  router,
  pathname,
}: {
  modalType: string;
  searchParams: URLSearchParams;
  router: ReturnType<typeof useRouter>;
  pathname: string;
}) {
  switch (modalType) {
    case "choose-mode":
      return (
        <ChooseModeModal
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("modal");
            params.delete("mode");
            router.replace(
              pathname + (params.toString() ? "?" + params.toString() : ""),
              { scroll: false },
            );
          }}
        />
      );
    case "speed-create":
      return (
        <SpeedCreateModal
          mode={(searchParams.get("mode") as "agent" | "expert") ?? "agent"}
          isOpen={true}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("modal");
            params.delete("mode");
            router.replace(
              pathname + (params.toString() ? "?" + params.toString() : ""),
              { scroll: false },
            );
          }}
        />
      );
    case "set-model":
      return (
        <SetModelModal
          type={(searchParams.get("type") as "solo" | "team") ?? "solo"}
          mode={(searchParams.get("mode") as "agent" | "expert") ?? "agent"}
          isOpen={true}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("modal");
            params.delete("type");
            params.delete("mode");
            router.replace(
              pathname + (params.toString() ? "?" + params.toString() : ""),
              { scroll: false },
            );
          }}
        />
      );
    default:
      return null;
  }
});

const ModalManager = memo(function ModalManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modalType = searchParams?.get("modal");

  if (!router || !pathname || !searchParams) {
    return null;
  }

  return (
    <>
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl">
            <ModalSelector
              modalType={modalType}
              searchParams={searchParams}
              router={router}
              pathname={pathname}
            />
          </div>
        </div>
      )}
    </>
  );
});
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

export default ModalManager;
