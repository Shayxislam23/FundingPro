"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string;
  label: string;
  sublabel?: string;
  subvalue?: string;
  className?: string;
  variant?: "light" | "dark";
}

export function MetricCard({
  value,
  label,
  sublabel,
  subvalue,
  className,
  variant = "light",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-8",
        variant === "light"
          ? "bg-funding-light-green border border-green-200"
          : "bg-funding-dark-2 border border-funding-border",
        className
      )}
    >
      <div
        className={cn(
          "text-5xl font-black mb-1",
          variant === "light" ? "text-funding-green" : "text-funding-accent"
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-sm font-medium",
          variant === "light" ? "text-funding-text-muted-light" : "text-funding-muted"
        )}
      >
        {label}
      </div>
      {subvalue && sublabel && (
        <>
          <div
            className={cn(
              "mt-6 pt-6 border-t",
              variant === "light" ? "border-green-200" : "border-funding-border/30"
            )}
          />
          <div
            className={cn(
              "text-3xl font-black mb-1",
              variant === "light" ? "text-funding-green" : "text-funding-accent"
            )}
          >
            {subvalue}
          </div>
          <div
            className={cn(
              "text-sm font-medium",
              variant === "light" ? "text-funding-text-muted-light" : "text-funding-muted"
            )}
          >
            {sublabel}
          </div>
        </>
      )}
    </div>
  );
}
