"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  CreditCard,
  BarChart3,
  Bot,
  HelpCircle,
  Settings,
  Briefcase,
  ScrollText,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const adminNav = [
  { label: "Главная", href: "/admin", icon: LayoutDashboard },
  { label: "Пользователи", href: "/admin/users", icon: Users },
  { label: "Гранты", href: "/admin/grants", icon: BookOpen },
  { label: "Платежи", href: "/admin/payments", icon: CreditCard },
  { label: "Выручка ZOOMRAD", href: "/admin/payments", icon: BarChart3 },
  { label: "AI-запросы", href: "/admin/ai-logs", icon: Bot },
  { label: "Поддержка", href: "/admin/support", icon: HelpCircle },
  { label: "Настройки", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-funding-light-bg flex">
      <aside className="w-64 bg-funding-dark flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10">
          <FundingProLogo variant="dark" size="sm" />
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3 h-3 text-funding-accent" />
            <span className="text-xs text-funding-muted font-medium">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={label + href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-funding-green text-white"
                    : "text-funding-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-funding-muted hover:text-red-400 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>
      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Администратор</span>
            <div className="w-8 h-8 rounded-xl bg-funding-green text-white flex items-center justify-center font-semibold text-sm">
              А
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
