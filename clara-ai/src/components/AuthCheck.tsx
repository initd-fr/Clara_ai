"use client";

import { useAppSession } from "~/context/SessionContext";
import { LoadingSpinner } from "~/app/(authenticated)/support/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, status } = useAppSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (status === "loading" || !isClient) {
    return <LoadingSpinner />;
  }

  if (!user && pathname && pathname.startsWith("/home")) {
    router.push("/auth");
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
