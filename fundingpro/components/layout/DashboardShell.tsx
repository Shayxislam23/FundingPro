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
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

// Static notifications — можно в будущем заменить на реальные из БД
const NOTIFICATIONS = [
  {
    id: 1,
    title: "Новые гранты доступны",
    body: "Добавлено 12 новых грантов по вашим интересам.",
    time: "2 ч назад",
    read: false,
  },
  {
    id: 2,
    title: "Заявка на рассмотрении",
    body: "Ваша заявка «USAID Инновации» принята к рассмотрению.",
    time: "1 д назад",
    read: false,
  },
  {
    id: 3,
    title: "Документ загружен",
    body: "Файл успешно сохранён в вашем хранилище.",
    time: "3 д назад",
    read: true,
  },
];

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
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
            {/* Notification bell */}
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
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-sm text-gray-800">
                      Уведомления
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-funding-accent text-white font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-funding-green hover:underline"
                      >
                        Отметить все
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors",
                          !n.read && "bg-funding-light-green/30"
                        )}
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                          )
                        }
                      >
                        <div
                          className={cn(
                            "mt-0.5 w-2 h-2 rounded-full flex-shrink-0",
                            n.read ? "bg-gray-300" : "bg-funding-accent"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Footer */}
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
