////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo } from "react";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TODO STATIC LOGO SIDEBAR///////////////////////////////////////////////////////////////////////////////////////
export const StaticLogoSidebar = memo(() => (
  <div className="relative mt-4 flex h-[80px] w-full flex-row items-center justify-center">
    <svg
      width="50"
      height="50"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="Logo Clara AI"
      role="img"
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
          <stop stopColor="#2196F3" />
          <stop offset="1" stopColor="#9C27B0" />
        </linearGradient>
      </defs>
      <path
        d="M75 20 A35 35 0 1 0 75 80"
        stroke="url(#sidebar-c-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
    <span
      className="absolute left-[70%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold leading-none tracking-wider text-gray-400"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      AI
    </span>
  </div>
));
////////////////////////////////////////////////////////////////////////////////TODO END STATIC LOGO SIDEBAR///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TODO STATIC SKELETON///////////////////////////////////////////////////////////////////////////////////////
export const StaticSkeleton = memo(() => (
  <div className="space-y-1 px-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="group relative flex h-14 items-center justify-between border-b border-base-content/10 px-4"
        aria-hidden="true"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-base-300 to-base-200 shadow-sm ring-1 ring-base-content/5">
            <div className="relative h-4 w-4 bg-base-content/60" />
          </div>
          <div className="mr-8 h-4 w-80 rounded bg-base-300/90" />
        </div>
        <div className="flex items-center">
          <div className="h-5 w-14 rounded-md bg-gradient-to-r from-base-300/80 to-base-200/80" />
          <div className="flex h-11 w-11 items-center justify-center opacity-80">
            <div className="h-6 w-6 rounded-full bg-base-300/90" />
          </div>
        </div>
      </div>
    ))}
  </div>
));
////////////////////////////////////////////////////////////////////////////////TODO END STATIC SKELETON///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TODO STATIC TOP NAVIGATION///////////////////////////////////////////////////////////////////////////////////////
export const StaticTopNavigation = memo(() => (
  <div className="flex justify-around gap-2 px-2">
    <div className="h-10 w-32 rounded-full bg-base-300/50" />
    <div className="h-10 w-32 rounded-full bg-base-300/30 opacity-50" />
  </div>
));
////////////////////////////////////////////////////////////////////////////////TODO END STATIC TOP NAVIGATION///////////////////////////////////////////////////////////////////////////////////////

StaticLogoSidebar.displayName = "StaticLogoSidebar";
StaticSkeleton.displayName = "StaticSkeleton";
StaticTopNavigation.displayName = "StaticTopNavigation";
