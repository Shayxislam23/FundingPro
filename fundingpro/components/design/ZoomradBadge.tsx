"use client";

import { cn } from "@/lib/utils";

interface ZoomradBadgeProps {
  className?: string;
  variant?: "outline" | "solid";
}

export function ZoomradBadge({ className, variant = "outline" }: ZoomradBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide",
        variant === "outline"
          ? "border border-funding-green text-funding-accent bg-transparent"
          : "bg-funding-green text-white",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-funding-accent" />
      ZOOMRAD
    </div>
  );
}
