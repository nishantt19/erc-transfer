"use client";
import { type ReactNode, useState } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const positionArrowClasses = {
    top: "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b",
    bottom: "-top-1 left-1/2 -translate-x-1/2 border-l border-t",
    left: "-right-1 top-1/2 -translate-y-1/2 border-r border-t",
    right: "-left-1 top-1/2 -translate-y-1/2 border-l border-b",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-input backdrop-blur-sm rounded-lg shadow-xl border border-border-input whitespace-nowrap ${positionClasses[position]}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-input border-border-input rotate-45 ${positionArrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
