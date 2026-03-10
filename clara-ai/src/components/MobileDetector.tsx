"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MobileDetectorProps {
  children: React.ReactNode;
}

export default function MobileDetector({ children }: MobileDetectorProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      return isMobileWidth || isMobileUserAgent;
    };

    if (checkMobile()) {
      router.replace("/mobile");
    }
  }, [router]);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
