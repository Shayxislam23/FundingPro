"use client";

import { cn } from "@/lib/utils";

interface FundingProLogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export function FundingProLogo({
  className,
  variant = "dark",
  size = "md",
}: FundingProLogoProps) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg font-black leading-none",
          size === "sm" ? "w-6 h-6 text-[10px]" : size === "md" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
          "bg-funding-green text-white"
        )}
      >
        FP
      </div>
      <span
        className={cn(
          "font-bold tracking-tight",
          sizes[size],
          variant === "dark" ? "text-white" : "text-funding-black"
        )}
      >
        Funding<span className="text-funding-accent">Pro</span>
      </span>
    </div>
  );
}
