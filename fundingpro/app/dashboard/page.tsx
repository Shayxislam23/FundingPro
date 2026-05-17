"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { BookOpen, BarChart3, CheckCircle2, FileText, ArrowRight, Sparkles, Target, Loader2 } from "lucide-react";
import { translateSector } from "@/lib/sector-labels";

type Grant = {
  id: string;
  title: string;
  title_ru: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  sectors: string[];
  country_scope: string[];
  donor: { name: string | null; name_ru: string | null };
};

type Application = {
  id: string;
  status: string;
  updated_at: string;
  grant: { title: string; title_ru: string | null };
};

const STATUS_LABELS: Record<string, string> = {
  saved: "Сохранено", preparing: "Подготовка", drafting: "Черновик",
  ready: "Готово", submitted: "Подана", under_review: "На рассмотрении",
  shortlisted: "Шортлист", won: "Получено", lost: "Отклонено",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  saved: { bg: "#F3F4F6", color: "#6B7280" },
  preparing: { bg: "#FEF3C7", color: "#D97706" },
  drafting: { bg: "#DBEAFE", color: "#2563EB" },
  ready: { bg: "#D9F7DD", color: "#008A2E" },
  submitted: { bg: "#D9F7DD", color: "#008A2E" },
  shortlisted: { bg: "#FDE68A", color: "#92400E" },
  won: { bg: "#D9F7DD", color: "#008A2E" },
  lost: { bg: "#FEE2E2", color: "#DC2626" },
};

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return undefined;
  if (max) return `до $${max.toLocaleString()}`;
  return `от $${min!.toLocaleString()}`;
}

export default function DashboardHome() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/grants?limit=4").then((r) => r.json()),
      fetch("/api/v1/applications?limit=3").then((r) => r.json()),
    ]).then(([grantsData, appsData]) => {
      setGrants(grantsData.data?.grants ?? []);
      setApplications(appsData.data?.applications ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalGrants = 153;

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-funding-black mb-1">Добро пожаловать</h1>
          <p className="text-sm text-gray-500">{totalGrants} грантов в базе · обновлено сегодня</p>
        </div>
        <Link
          href="/dashboard/ai-writer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#008A2E" }}
        >
          <Sparkles className="w-4 h-4" />
          AI-предложение
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Грантов в базе", value: String(totalGrants), subtitle: "актуальная база", icon: BookOpen },
          { title: "Мои заявки", value: String(applications.length), subtitle: applications.length > 0 ? `${applications.filter(a => !["won","lost","closed"].includes(a.status)).length} активных` : "нет заявок", icon: BarChart3 },
          { title: "AI-инструменты", value: "3", subtitle: "доступно", icon: CheckCircle2 },
          { title: "Секторов", value: "15+", subtitle: "категорий", icon: FileText },
        ].map(({ title, value, subtitle, icon: Icon }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
              <div className="w-7 h-7 rounded-lg bg-funding-light-green flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-funding-green" />
              </div>
            </div>
            <p className="text-2xl font-black text-funding-black">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grants */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel>База грантов</SectionLabel>
              <h2 className="font-bold text-funding-black">Последние гранты</h2>
            </div>
            <Link href="/dashboard/grants" className="text-sm font-semibold flex items-center gap-1" style={{ color: "#008A2E" }}>
              Все гранты <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-funding-green" />
            </div>
          ) : (
            <div className="space-y-3">
              {grants.map((g) => (
                <Link key={g.id} href={`/dashboard/grants/${g.id}`}>
                  <GrantCard
                    id={g.id}
                    title={g.title_ru ?? g.title}
                    donor={g.donor.name_ru ?? g.donor.name ?? "—"}
                    amount={formatAmount(g.amount_min, g.amount_max)}
                    deadline={g.deadline ? new Date(g.deadline).toLocaleDateString("ru-RU") : undefined}
                    country={g.country_scope[0] ?? "—"}
                    sector={g.sectors[0] ? translateSector(g.sectors[0]) : undefined}
                    variant="light"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-funding-black">Мои заявки</h3>
              <Link href="/dashboard/tracker" className="text-xs font-semibold" style={{ color: "#008A2E" }}>Все →</Link>
            </div>
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <p className="text-xs text-gray-400 mb-2">Нет активных заявок</p>
                <Link href="/dashboard/grants" className="text-xs font-semibold text-funding-green">Найти грант →</Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {applications.map((app, i) => {
                  const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.saved;
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: i < applications.length - 1 ? "1px solid #f3f4f6" : "none" }}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-xs font-medium text-funding-black truncate">
                          {app.grant?.title_ru ?? app.grant?.title ?? "—"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(app.updated_at).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={sc}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="font-bold text-sm text-funding-black mb-3">Быстрые действия</h3>
            <div className="space-y-2">
              {[
                { label: "Найти гранты", href: "/dashboard/grants", icon: BookOpen },
                { label: "Проверить соответствие", href: "/dashboard/eligibility", icon: Target },
                { label: "Создать AI-предложение", href: "/dashboard/ai-writer", icon: Sparkles },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-funding-green/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-funding-light-green flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-funding-green" />
                  </div>
                  <span className="text-sm font-medium text-funding-black">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
