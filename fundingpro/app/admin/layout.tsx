"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { getAuthHeaders } from "@/lib/client-auth";
import {
  Building2,
  Landmark,
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Bot,
  HelpCircle,
  Settings,
  ShieldCheck,
  ScrollText,
  Briefcase,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Shield,
  GraduationCap,
} from "lucide-react";
import {
  AppShellSidebar,
  AppShellHeader,
  type AppNavItem,
} from "@/components/layout/AppShell";

const adminNav: AppNavItem[] = [
  { label: "Главная", href: "/admin", icon: LayoutDashboard },
  { label: "Пользователи", href: "/admin/users", icon: Users },
  { label: "Opportunities Lab", href: "/admin/lab", icon: GraduationCap },
  { label: "Воронка", href: "/admin/funnel", icon: TrendingUp },
  { label: "Заявки", href: "/admin/applications", icon: ClipboardList },
  { label: "Согласия", href: "/admin/consents", icon: Shield },
  { label: "Организации", href: "/admin/organizations", icon: Building2 },
  { label: "Гранты", href: "/admin/grants", icon: BookOpen },
  { label: "Доноры", href: "/admin/donors", icon: Landmark },
  { label: "Заказы консультантов", href: "/admin/consultant-orders", icon: Briefcase },
  { label: "Платежи", href: "/admin/payments", icon: CreditCard },
  { label: "Success fee", href: "/admin/success-fees", icon: DollarSign },
  { label: "AI-запросы", href: "/admin/ai-logs", icon: Bot },
  { label: "Поддержка", href: "/admin/support", icon: HelpCircle },
  { label: "Аудит", href: "/admin/audit", icon: ScrollText },
  { label: "Настройки", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/me", { headers });
        if (!res.ok) {
          router.replace("/auth?next=/admin");
          return;
        }
        const json = await res.json();
        const data = json.data;
        if (!data?.isAdmin) {
          router.replace("/dashboard");
          return;
        }
        setAdminEmail(data.email ?? null);
        setIsAdmin(true);
      } catch {
        router.replace("/auth?next=/admin");
      }
    })();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-funding-light-bg flex items-center justify-center">
        <p className="text-sm text-gray-500">Проверка доступа…</p>
      </div>
    );
  }

  const adminInitial = (adminEmail?.[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-funding-light-bg flex">
      <aside className="w-64 bg-funding-dark flex flex-col fixed h-full">
        <AppShellSidebar
          variant="dark"
          pathname={pathname}
          navItems={adminNav}
          logo={
            <>
              <FundingProLogo variant="dark" size="sm" />
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck className="w-3 h-3 text-funding-accent" />
                <span className="text-xs text-funding-muted font-medium">Admin Panel</span>
              </div>
            </>
          }
        />
      </aside>
      <div className="flex-1 ml-64">
        <AppShellHeader email={adminEmail ?? "Администратор"} initial={adminInitial} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
