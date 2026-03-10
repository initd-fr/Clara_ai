////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { cn } from "~/lib/utils";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  hideScrollbar?: boolean;
  fadeTop?: boolean;
  fadeBottom?: boolean;
}
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({
    className,
    children,
    maxHeight = "100%",
    onScroll,
    hideScrollbar = false,
    fadeTop = false,
    fadeBottom = false,
    ...props
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(false);

    const handleScroll = useCallback(
      (e: UIEvent<HTMLDivElement>) => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (fadeTop) {
          setShowTopFade(scrollTop > 10);
        }
        if (fadeBottom) {
          setShowBottomFade(scrollTop + clientHeight < scrollHeight - 10);
        }
        onScroll?.(e);
      },
      [onScroll, fadeTop, fadeBottom],
    );
    useEffect(() => {
      if (!scrollRef.current || !fadeBottom) return;
      const { scrollHeight, clientHeight } = scrollRef.current;
      setShowBottomFade(scrollHeight > clientHeight);
    }, [fadeBottom, children]);

    return (
      <div className="relative" style={{ maxHeight }}>
        {/* Effet de fade en haut */}
        {fadeTop && showTopFade && (
          <div className="pointer-events-none absolute top-0 z-10 h-6 w-full bg-gradient-to-b from-base-200 to-transparent" />
        )}

        {/* Zone de défilement */}
        <div
          ref={scrollRef}
          className={cn(
            "overflow-auto",
            hideScrollbar && "scrollbar-none",
            !hideScrollbar &&
              "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral/20 hover:scrollbar-thumb-neutral/30",
            className,
          )}
          onScroll={handleScroll}
          role="region"
          aria-label="Zone de défilement"
          {...props}
        >
          {children}
        </div>

        {/* Effet de fade en bas */}
        {fadeBottom && showBottomFade && (
          <div className="pointer-events-none absolute bottom-0 z-10 h-6 w-full bg-gradient-to-t from-base-200 to-transparent" />
        )}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
/////////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
