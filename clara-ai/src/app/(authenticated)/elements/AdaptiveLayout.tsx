"use client";

import { useSidebar } from "~/components/SidebarProvider";

export default function AdaptiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <div className="relative flex min-h-screen">
      <main
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isOpen ? "ml-80" : "ml-20"}
        `}
      >
        <div className="h-full w-full bg-base-100">{children}</div>
      </main>
    </div>
  );
}
