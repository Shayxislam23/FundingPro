"use client";

import { cn } from "@/lib/utils";
import { Calendar, MapPin, DollarSign, Bookmark, BookmarkCheck } from "lucide-react";

interface GrantCardProps {
  id: string;
  title: string;
  donor: string;
  amount?: string;
  deadline?: string;
  deadlineUrgency?: "urgent" | "soon" | "normal" | null;
  country?: string;
  sector?: string;
  matchScore?: number;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  variant?: "dark" | "light";
  className?: string;
}

export function GrantCard({
  id,
  title,
  donor,
  amount,
  deadline,
  deadlineUrgency,
  country,
  sector,
  matchScore,
  isSaved,
  onSave,
  variant = "light",
  className,
}: GrantCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200 group",
        variant === "light"
          ? "bg-white border border-gray-100 hover:border-funding-green/30 hover:shadow-md"
          : "bg-funding-dark-2 border border-funding-border/20 hover:border-funding-border",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          {matchScore !== undefined && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-funding-light-green text-funding-green text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-funding-accent" />
              {matchScore}% совпадение
            </div>
          )}
          <h3
            className={cn(
              "font-semibold text-base leading-snug line-clamp-2",
              variant === "light" ? "text-funding-black" : "text-white"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-sm mt-1 font-medium",
              variant === "light" ? "text-funding-green" : "text-funding-accent"
            )}
          >
            {donor}
          </p>
        </div>
        {onSave && (
          <button
            onClick={() => onSave(id)}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-lg transition-colors",
              variant === "light"
                ? "hover:bg-funding-light-green text-gray-400 hover:text-funding-green"
                : "hover:bg-funding-green/20 text-funding-muted hover:text-funding-accent"
            )}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-funding-accent" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-3 text-xs",
          variant === "light" ? "text-funding-text-muted-light" : "text-funding-muted"
        )}
      >
        {amount && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {amount}
          </span>
        )}
        {deadline && (
          <span
            className={cn(
              "flex items-center gap-1",
              deadlineUrgency === "urgent" && "text-red-600 font-semibold",
              deadlineUrgency === "soon" && "text-amber-700 font-medium"
            )}
          >
            <Calendar className="w-3 h-3" />
            {deadline}
            {deadlineUrgency === "urgent" && " · срочно"}
          </span>
        )}
        {country && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {country}
          </span>
        )}
        {sector && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-funding-light-green text-funding-green font-medium">
            {sector}
          </span>
        )}
      </div>
    </div>
  );
}
