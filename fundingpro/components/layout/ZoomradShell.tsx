"use client";

import { cn } from "@/lib/utils";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { ZoomradBadge } from "@/components/design/ZoomradBadge";
import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface ZoomradShellProps {
  children: React.ReactNode;
  className?: string;
  showBack?: boolean;
  title?: string;
  variant?: "dark" | "light";
  showNotifications?: boolean;
}

export function ZoomradShell({
  children,
  className,
  showBack,
  title,
  variant = "dark",
  showNotifications = false,
}: ZoomradShellProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "min-h-screen w-full max-w-[430px] mx-auto flex flex-col",
        variant === "dark" ? "bg-funding-dark text-white" : "bg-funding-light-bg text-funding-black",
        className
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "flex items-center justify-between px-4 py-3 sticky top-0 z-50",
          variant === "dark"
            ? "bg-funding-dark border-b border-white/5"
            : "bg-white border-b border-gray-100"
        )}
      >
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                variant === "dark" ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : null}
          {title ? (
            <span className="font-semibold text-sm">{title}</span>
          ) : (
            <FundingProLogo variant={variant === "dark" ? "dark" : "light"} size="sm" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {showNotifications && (
            <button
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                variant === "dark" ? "hover:bg-white/10 text-funding-muted" : "hover:bg-gray-100 text-gray-500"
              )}
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          <ZoomradBadge variant="outline" className="scale-90" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
