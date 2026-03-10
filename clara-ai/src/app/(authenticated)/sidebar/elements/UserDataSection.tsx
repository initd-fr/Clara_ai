////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { memo } from "react";
import { api } from "~/trpc/react";
import { StorageProgress, CreditsProgress } from "../components/ProgressBars";
import { useAppSession } from "~/context/SessionContext";

// //////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface SubscriptionInfo {
  hasSubscription: boolean;
  subscriptionName: string;
  dailyMessageLimit: number | null;
  storageLimitGB: number | null;
  canCreatePersonalModels: boolean;
  canAccessStoreModels: boolean;
  maxPersonalModels: number | null;
}

interface User {
  role?: string;
  accountType?: string;
  firstName?: string;
  subscriptionInfo?: SubscriptionInfo;
}

interface ProgressSectionProps {
  user: User;
  dailyMessages?: number;
  storageData?: { totalSizeInMB?: number | undefined };
}
// ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

const formatAccountType = (role: string, accountType: string): string => {
  if (role === "admin") return "Admin";
  if (role === "support") return "Support";
  if (accountType) {
    return (
      accountType.charAt(0).toUpperCase() + accountType.slice(1).toLowerCase()
    );
  }
  return "User";
};
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TODO USER AVATAR///////////////////////////////////////////////////////////////////////////////////////
const UserAvatar = memo(() => (
  <div className="avatar shrink-0">
    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-14 w-11 text-base-content/70"
        aria-hidden="true"
        role="img"
      >
        <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z"></path>
        <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z"></path>
      </svg>
    </div>
  </div>
));
////////////////////////////////////////////////////////////////////////////////TODO END USER AVATAR///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TODO USER INFO///////////////////////////////////////////////////////////////////////////////////////
const UserInfo = memo(({ user }: { user: User }) => {
  const getBadgeInfo = () => {
    if (user?.role === "admin") {
      return { className: "badge-error text-base-100", text: "Admin" };
    }
    if (user?.role === "support") {
      return { className: "badge-warning text-base-100", text: "Support" };
    }
    if (user?.subscriptionInfo?.hasSubscription) {
      const isStoreSubscription =
        user.subscriptionInfo.canAccessStoreModels &&
        !user.subscriptionInfo.canCreatePersonalModels;
      return {
        className: isStoreSubscription
          ? "badge-warning text-base-100"
          : "badge-primary text-base-100",
        text: user.subscriptionInfo.subscriptionName,
      };
    }
    return {
      className: "badge-success text-base-100",
      text: formatAccountType(user?.role || "", user?.accountType || ""),
    };
  };
  //////////////////////////////////////////////////////////////////////////////////TODO END USER INFO///////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////TODO BADGE INFO///////////////////////////////////////////////////////////////////////////////////////
  const badgeInfo = getBadgeInfo();
  //////////////////////////////////////////////////////////////////////////////////TODO END BADGE INFO///////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-base-content">
        {user?.firstName || "Utilisateur"}
      </p>
      <p
        className={`badge text-sm ${badgeInfo.className}`}
        role="status"
        aria-label={`Type de compte: ${badgeInfo.text}`}
      >
        {badgeInfo.text}
      </p>
    </div>
  );
});
////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TODO PROGRESS SECTION///////////////////////////////////////////////////////////////////////////////////////
const ProgressSection = memo(
  ({ user, dailyMessages, storageData }: ProgressSectionProps) => {
    const isAdminOrSupport = user?.role === "admin" || user?.role === "support";
    const isStoreSubscription =
      user?.subscriptionInfo?.hasSubscription &&
      user.subscriptionInfo.canAccessStoreModels &&
      !user.subscriptionInfo.canCreatePersonalModels;
    if (isAdminOrSupport || isStoreSubscription) {
      return null;
    }
    const hasSubscription = user?.subscriptionInfo?.hasSubscription;

    const dailyMessageLimit =
      hasSubscription && user.subscriptionInfo
        ? user.subscriptionInfo.dailyMessageLimit
        : null; // Utiliser null (illimité) au lieu de 20
    const storageLimitGB =
      hasSubscription && user.subscriptionInfo
        ? user.subscriptionInfo.storageLimitGB
        : null;

    return (
      <div className="space-y-4 pt-4">
        {dailyMessageLimit !== null &&
          dailyMessageLimit > 0 &&
          dailyMessages !== undefined && (
            <CreditsProgress dailyMessages={dailyMessages} />
          )}
        <StorageProgress
          totalStorageSize={storageData?.totalSizeInMB}
          accountType={user?.accountType}
          storageLimitGB={storageLimitGB}
        />
      </div>
    );
  },
);
////////////////////////////////////////////////////////////////////////////////TODO END PROGRESS SECTION///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TODO USER DATA SECTION///////////////////////////////////////////////////////////////////////////////////////
const UserDataSection = memo(() => {
  const { user } = useAppSession();
  const isStoreSubscription =
    user?.subscriptionInfo?.canAccessStoreModels &&
    !user?.subscriptionInfo?.canCreatePersonalModels;
  const isAdminOrSupport = user?.role === "admin" || user?.role === "support";
  //////////////////////////////////////////////////////////////////////////////////TODO END IS STORE SUBSCRIPTION///////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////TODO HAS LIMITS///////////////////////////////////////////////////////////////////////////////////////
  const hasLimits = () => {
    if (isAdminOrSupport || isStoreSubscription) {
      return false;
    }

    const hasSubscription = user?.subscriptionInfo?.hasSubscription;
    const dailyMessageLimit = hasSubscription
      ? (user.subscriptionInfo?.dailyMessageLimit ?? null)
      : null;
    const storageLimitGB = hasSubscription
      ? (user.subscriptionInfo?.storageLimitGB ?? null)
      : null;

    return (
      (dailyMessageLimit !== null && dailyMessageLimit > 0) ||
      (storageLimitGB !== null && storageLimitGB > 0)
    );
  };
  //////////////////////////////////////////////////////////////////////////////////TODO END HAS LIMITS///////////////////////////////////////////////////////////////////////////////////////
  const shouldLoadLimits = hasLimits();
  const { data: storageData } = api.buckets.getTotalStorageSize.useQuery(
    undefined,
    {
      enabled: shouldLoadLimits,
    },
  );
  //////////////////////////////////////////////////////////////////////////////////TODO END STORAGE DATA///////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////TODO DAILY MESSAGES///////////////////////////////////////////////////////////////////////////////////////
  const { data: dailyMessages } = api.user.getDailyMessages.useQuery(
    undefined,
    {
      enabled: shouldLoadLimits,
    },
  );
  //////////////////////////////////////////////////////////////////////////////////TODO END DAILY MESSAGES///////////////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  if (!user) {
    return (
      <section
        className="relative w-full"
        aria-label="Chargement des informations utilisateur"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
        <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="avatar shrink-0">
                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border-2 border-base-content/10 bg-base-300/50 backdrop-blur-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 h-4 w-24 animate-pulse rounded bg-base-300/80" />
                <div className="h-4 w-16 animate-pulse rounded bg-base-200/80" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full" aria-label="Informations utilisateur">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10  backdrop-blur-sm" />
      <div className="relative rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-md">
        {isStoreSubscription || isAdminOrSupport || !hasLimits() ? (
          <div className="p-3">
            <div className="flex items-center gap-3">
              <UserAvatar />
              <UserInfo user={user} />
            </div>
          </div>
        ) : (
          <details className="collapse collapse-arrow w-full">
            <summary
              className="collapse-title min-w-full cursor-pointer p-3"
              aria-label="Afficher les détails de l'utilisation"
            >
              <div className="flex items-center gap-3">
                <UserAvatar />
                <UserInfo user={user} />
              </div>
            </summary>
            <div className="collapse-content border-t border-white/10">
              <ProgressSection
                user={user}
                dailyMessages={dailyMessages}
                storageData={storageData}
              />
            </div>
          </details>
        )}
      </div>
    </section>
  );
  ////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
});

UserAvatar.displayName = "UserAvatar";
UserInfo.displayName = "UserInfo";
ProgressSection.displayName = "ProgressSection";
UserDataSection.displayName = "UserDataSection";

export default UserDataSection;
