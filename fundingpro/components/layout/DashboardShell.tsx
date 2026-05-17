"use client";

import { cn } from "@/lib/utils";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import {
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  BookOpen,
  CheckSquare,
  FolderOpen,
  CreditCard,
  Users,
  HelpCircle,
  LogOut,
  ChevronRight,
  BarChart3,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { label: "Гранты", href: "/dashboard/grants", icon: BookOpen },
  { label: "Проверка соответствия", href: "/dashboard/eligibility", icon: CheckSquare },
  { label: "AI Предложение", href: "/dashboard/ai-writer", icon: FileText },
  { label: "Мои заявки", href: "/dashboard/tracker", icon: BarChart3 },
  { label: "Документы", href: "/dashboard/documents", icon: FolderOpen },
  { label: "Консультанты", href: "/dashboard/consultants", icon: Briefcase },
  { label: "Подписка", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Поддержка", href: "/dashboard/support", icon: HelpCircle },
];

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-funding-light-bg flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <FundingProLogo variant="light" size="md" />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-funding-green text-white"
                    : "text-gray-600 hover:bg-funding-light-green hover:text-funding-green"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск грантов..."
              className="pl-9 pr-4 py-2 bg-funding-light-bg rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-funding-green/20 w-64"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-funding-light-green text-gray-500 hover:text-funding-green transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-funding-accent" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-funding-green text-white flex items-center justify-center font-semibold text-sm">
              И
            </div>
          </div>
        </header>

        <main className={cn("flex-1 p-6", className)}>{children}</main>
      </div>
    </div>
  );
}
