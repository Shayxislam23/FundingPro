"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function ShellNavLink({
  label,
  href,
  icon: Icon,
  active,
  onNavigate,
  compact,
  variant = "light",
}: AppNavItem & {
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150",
        compact ? "flex-col gap-1 px-2 py-2 text-[10px]" : "px-3 py-2.5",
        active
          ? compact
            ? isDark
              ? "text-funding-accent"
              : "text-funding-green"
            : isDark
              ? "bg-funding-green text-white"
              : "bg-funding-green text-white"
          : compact
            ? isDark
              ? "text-funding-muted"
              : "text-gray-500"
            : isDark
              ? "text-funding-muted hover:bg-white/5 hover:text-white"
              : "text-gray-600 hover:bg-funding-light-green hover:text-funding-green"
      )}
    >
      <Icon className={cn("flex-shrink-0", compact ? "w-5 h-5" : "w-4 h-4")} />
      <span className={compact ? "truncate max-w-[4.5rem]" : undefined}>{label}</span>
    </Link>
  );
}

export function ShellLogoutButton({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors",
        variant === "dark"
          ? "text-funding-muted hover:text-red-400"
          : "text-gray-500 hover:bg-red-50 hover:text-red-600",
        className
      )}
    >
      <LogOut className="w-4 h-4" />
      Выйти
    </button>
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin" || href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}

export type AppShellSidebarProps = {
  navItems: AppNavItem[];
  pathname: string;
  variant?: "light" | "dark";
  logo: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  onNavigate?: () => void;
};

export function AppShellSidebar({
  navItems,
  pathname,
  variant = "light",
  logo,
  badge,
  footer,
  onNavigate,
}: AppShellSidebarProps) {
  const isDark = variant === "dark";

  return (
    <>
      <div className={cn("p-6 border-b", isDark ? "border-white/10" : "border-gray-100")}>
        {logo}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <ShellNavLink
            key={item.href}
            {...item}
            variant={variant}
            active={isNavItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      {badge ? <div className="px-4 pb-2">{badge}</div> : null}
      <div className={cn("p-4 border-t", isDark ? "border-white/10" : "border-gray-100")}>
        {footer ?? <ShellLogoutButton variant={variant} />}
      </div>
    </>
  );
}

export type AppShellHeaderProps = {
  children?: React.ReactNode;
  email?: string | null;
  initial?: string;
};

export function AppShellHeader({ children, email, initial = "U" }: AppShellHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {email ? (
          <span className="text-xs text-gray-500 truncate max-w-[180px]">{email}</span>
        ) : null}
        <div className="w-8 h-8 rounded-xl bg-funding-green text-white flex items-center justify-center font-semibold text-sm">
          {initial}
        </div>
      </div>
    </header>
  );
}
