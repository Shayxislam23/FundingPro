"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
  variant?: "light" | "dark" | "green";
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = "light",
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6",
        variant === "light" && "bg-white border border-gray-100",
        variant === "dark" && "bg-funding-dark-2 border border-funding-border/20",
        variant === "green" && "bg-funding-green text-white",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          className={cn(
            "text-sm font-medium",
            variant === "light" && "text-gray-500",
            variant === "dark" && "text-funding-muted",
            variant === "green" && "text-green-200"
          )}
        >
          {title}
        </p>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              variant === "light" && "bg-funding-light-green",
              variant === "dark" && "bg-funding-green/20",
              variant === "green" && "bg-white/20"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                variant === "light" && "text-funding-green",
                variant === "dark" && "text-funding-accent",
                variant === "green" && "text-white"
              )}
            />
          </div>
        )}
      </div>
      <div
        className={cn(
          "text-3xl font-black mb-1",
          variant === "light" && "text-funding-black",
          variant === "dark" && "text-white",
          variant === "green" && "text-white"
        )}
      >
        {value}
      </div>
      {subtitle && (
        <p
          className={cn(
            "text-xs",
            variant === "light" && "text-gray-400",
            variant === "dark" && "text-funding-muted",
            variant === "green" && "text-green-100"
          )}
        >
          {subtitle}
        </p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={cn(
              "text-xs font-semibold",
              trend.positive ? "text-funding-accent" : "text-red-500"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
