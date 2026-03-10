////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";
import { memo } from "react";
import { useAppSession } from "~/context/SessionContext";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type ProgressBarProps = {
  label: string;
  current: number;
  max: number;
  className?: string;
  isStorage?: boolean;
};

export type AccountType = string;

type StorageProgressProps = {
  totalStorageSize: number | undefined;
  accountType: AccountType | undefined;
  storageLimitGB?: number | null;
};
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
export function ProgressBar({
  label,
  current,
  max,
  className = "",
  isStorage = false,
}: ProgressBarProps) {
  if (max <= 0) return null;
  const displayCurrent = isStorage ? (current / 1024).toFixed(2) : current;
  const displayMax = isStorage
    ? max === -1
      ? "Illimité"
      : (max / 1024).toFixed(2)
    : max;
  const percentage = Math.max(0.1, Math.min((current / max) * 100, 100));

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-error";
    if (percent >= 70) return "bg-warning";
    return "bg-success";
  };

  return (
    <div
      className={`space-y-1.5 rounded-xl bg-base-100/30 p-3 shadow-md ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-base-content/70">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-base-content/70">
            {displayCurrent}/{displayMax}
          </span>
          {isStorage && <span className="text-base-content/70">Go</span>}
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-base-content/20">
        <div
          className={`h-full min-w-[2px] rounded-full transition-all duration-300 ${getProgressColor(
            percentage,
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TODO STORAGE PROGRESS///////////////////////////////////////////////////////////////////////////////////////
export function StorageProgress({
  totalStorageSize,
  accountType = "default",
  storageLimitGB,
}: StorageProgressProps) {
  const { totalStorageLimit } = useAppSession();

  let maxStorage: number;
  if (storageLimitGB !== null && storageLimitGB !== undefined) {
    maxStorage = storageLimitGB * 1024; // Stocké en Mo pour la logique, affiché en Go
  } else {
    maxStorage = totalStorageLimit(accountType ?? "free");
  }

  return (
    <ProgressBar
      label="Espace de Stockage"
      current={totalStorageSize ?? 0}
      max={maxStorage}
      className="mb-2"
      isStorage={true}
    />
  );
}

export const CreditsProgress = memo(
  ({ dailyMessages }: { dailyMessages: number }) => {
    const { user, dailyMessagesLimit } = useAppSession();
    const limit = dailyMessagesLimit(user?.accountType ?? "free");
    return (
      <ProgressBar
        label="Messages Quotidiens"
        current={dailyMessages}
        max={limit}
        className="mb-2"
      />
    );
  },
);

CreditsProgress.displayName = "CreditsProgress";
// ~ ///////////////////////////////////////////////////////////////////////////////TODO END STORAGE PROGRESS///////////////////////////////////////////////////////////////////////////////////////
