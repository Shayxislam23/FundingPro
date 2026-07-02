"use client";

import { cn } from "@/lib/utils";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import {
  Search,
  Bell,
  LayoutDashboard,
  FileText,
  GraduationCap,
  BookOpen,
  CheckSquare,
  FolderOpen,
  CreditCard,
  HelpCircle,
  LogOut,
  BarChart3,
  Briefcase,
  Building2,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { getAuthHeaders } from "@/lib/client-auth";
import { PlanUsageBadge } from "@/components/design/PlanUsageBadge";
import { ShellNavLink, isNavItemActive } from "@/components/layout/AppShell";

const navItems = [
  { label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { label: "Гранты", href: "/dashboard/grants", icon: BookOpen },
  { label: "Opportunities Lab", href: "/dashboard/lab", icon: GraduationCap },
  { label: "Проверка соответствия", href: "/dashboard/eligibility", icon: CheckSquare },
  { label: "AI Предложение", href: "/dashboard/ai-writer", icon: FileText },
  { label: "Мои заявки", href: "/dashboard/tracker", icon: BarChart3 },
  { label: "Документы", href: "/dashboard/documents", icon: FolderOpen },
  { label: "Консультанты", href: "/dashboard/consultants", icon: Briefcase },
  { label: "Профиль", href: "/dashboard/profile", icon: Building2 },
  { label: "Подписка", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Поддержка", href: "/dashboard/support", icon: HelpCircle },
];

const mobileBottomNav = [
  { label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { label: "Гранты", href: "/dashboard/grants", icon: BookOpen },
  { label: "Проверка", href: "/dashboard/eligibility", icon: CheckSquare },
  { label: "AI", href: "/dashboard/ai-writer", icon: FileText },
];

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const unreadCount = 0;
  const userInitial = (userEmail?.[0] ?? orgName?.[0] ?? "U").toUpperCase();

  function isActive(href: string) {
    return isNavItemActive(pathname ?? "", href);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      router.push("/dashboard/grants");
      return;
    }
    router.push(`/dashboard/grants?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/me", { headers });
        if (!res.ok) return;
        const json = await res.json();
        setUserEmail(json.data?.email ?? null);
        setOrgName(json.data?.organization?.name ?? null);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await signOut();
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-funding-light-bg flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <FundingProLogo variant="light" size="md" />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <ShellNavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>
        <div className="px-4 pb-2">
          <PlanUsageBadge />
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile slide-over */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрыть меню"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <FundingProLogo variant="light" size="sm" />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <ShellNavLink
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl hover:bg-funding-light-green text-gray-600"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex-shrink-0">
              <FundingProLogo variant="light" size="sm" />
            </div>
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 max-w-xs sm:max-w-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск грантов..."
                className="pl-9 pr-4 py-2 bg-funding-light-bg rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-funding-green/20 w-full sm:w-48 md:w-64"
              />
            </form>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <PlanUsageBadge compact />
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl hover:bg-funding-light-green text-gray-500 hover:text-funding-green transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-funding-accent" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-sm text-gray-800">Уведомления</span>
                  </div>
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Уведомлений пока нет
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <Link
                      href="/dashboard/support"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-funding-green hover:underline"
                    >
                      Перейти в поддержку
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-funding-light-green transition-colors"
              title={userEmail ?? undefined}
            >
              <div className="w-8 h-8 rounded-xl bg-funding-green text-white flex items-center justify-center font-semibold text-sm">
                {userInitial}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[140px]">
                  {orgName ?? "Профиль"}
                </p>
                <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{userEmail ?? ""}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className={cn("flex-1 p-4 sm:p-6 pb-24 lg:pb-6", className)}>{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-2 py-2 safe-area-pb">
          <div className="flex items-center justify-around">
            {mobileBottomNav.map((item) => (
              <ShellNavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                compact
              />
            ))}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-medium rounded-xl",
                mobileNavOpen ? "text-funding-green" : "text-gray-500"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>Ещё</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
