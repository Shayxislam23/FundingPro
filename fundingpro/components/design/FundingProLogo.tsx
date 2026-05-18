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
