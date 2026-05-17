"use client";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  label?: string;
}

export function LoadingState({ className, label = "Загрузка..." }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16", className)}>
      <div className="w-8 h-8 border-2 border-funding-green border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
