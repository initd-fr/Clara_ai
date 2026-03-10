"use client";

import { memo } from "react";

interface SecondaryLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SecondaryLoader = memo(
  ({ size = "md", className = "" }: SecondaryLoaderProps) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-16 h-16",
    };

    const textSizes = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {/* Cercle gradient qui tourne autour de son centre */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transformOrigin: "center center",
            animation: "spin-slow 2s linear infinite",
          }}
        >
          <defs>
            <linearGradient
              id="secondary-loader-gradient"
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
          {/* Cercle complet qui tourne autour du centre */}
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="url(#secondary-loader-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="220"
            strokeDashoffset="55"
            style={{
              transformOrigin: "50px 50px",
              animation: "spin-slow 2s linear infinite",
            }}
          />
        </svg>

        {/* Texte "AI" au centre (ne tourne pas) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-bold text-gray-400 ${textSizes[size]}`}
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            AI
          </span>
        </div>

        <style jsx>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  },
);

SecondaryLoader.displayName = "SecondaryLoader";

export default SecondaryLoader;
