"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  className?: string;
  onSelect?: () => void;
}

export function PricingCard({
  name,
  price,
  period = "/мес",
  description,
  features,
  cta,
  highlighted,
  className,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-8 flex flex-col transition-all duration-200",
        highlighted
          ? "bg-funding-green text-white shadow-xl shadow-funding-green/20"
          : "bg-white border border-gray-100 hover:border-funding-green/40",
        className
      )}
    >
      <div className="mb-6">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-widest mb-2",
            highlighted ? "text-green-200" : "text-funding-accent"
          )}
        >
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span className={cn("text-4xl font-black", highlighted ? "text-white" : "text-funding-black")}>
            {price}
          </span>
          <span className={cn("text-sm mb-1.5", highlighted ? "text-green-200" : "text-gray-400")}>
            {period}
          </span>
        </div>
        {description && (
          <p className={cn("text-sm mt-2", highlighted ? "text-green-100" : "text-gray-500")}>
            {description}
          </p>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                highlighted ? "bg-white/20" : "bg-funding-light-green"
              )}
            >
              <Check
                className={cn(
                  "w-2.5 h-2.5",
                  highlighted ? "text-white" : "text-funding-green"
                )}
              />
            </span>
            <span className={highlighted ? "text-green-50" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
          highlighted
            ? "bg-white text-funding-green hover:bg-green-50"
            : "bg-funding-green text-white hover:bg-funding-green/90"
        )}
      >
        {cta}
      </button>
    </div>
  );
}
