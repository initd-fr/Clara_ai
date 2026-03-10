"use client";

import { memo } from "react";
import { X } from "lucide-react";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

const CloseButton = memo(({ onClick, className = "" }: CloseButtonProps) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base-content/60 transition-all duration-200 hover:scale-105 hover:bg-base-content/10 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
    type="button"
    style={{ pointerEvents: "auto" }}
  >
    <X className="h-5 w-5" />
  </button>
));

CloseButton.displayName = "CloseButton";

export default CloseButton;
