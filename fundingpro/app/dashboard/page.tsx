"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/design/DashboardCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { StatusBadge } from "@/components/design/StatusBadge";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  BarChart3,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";

const recentGrants = [
  {
    id: "1",
    title: "UNDP Small Grants Programme",
    donor: "UNDP Узбекистан",
    amount: "до $50,000",
    deadline: "30.06.2025",
    sector: "Экология",
    matchScore: 87,
  },
  {
    id: "4",
    title: "World Bank BETF — Образование и технологии",
    donor: "World Bank",
    amount: "$20,000 – $80,000",
    deadline: "20.07.2025",
    sector: "Образование",
    matchScore: 91,
  },
];

const recentApplications = [
  { id: "1", title: "UNDP Small Grants", status: "drafting" as const, updated: "15.05.2025" },
  { id: "2", title: "GIZ CCD Климат", status: "submitted" as const, updated: "10.05.2025" },
  { id: "3", title: "World Bank BETF", status: "shortlisted" as const, updated: "01.05.2025" },
];

export default function DashboardHome() {
  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-funding-black mb-1">Добро пожаловать</h1>
          <p className="text-sm text-gray-500">AI подобрал для вас 12 новых грантов</p>
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
        <DashboardCard
          title="Подходящих грантов"
          value="24"
          subtitle="обновлено сегодня"
          icon={BookOpen}
          trend={{ value: "+3 новых", positive: true }}
        />
        <DashboardCard
          title="Мои заявки"
          value="7"
          subtitle="3 активных"
          icon={BarChart3}
        />
        <DashboardCard
          title="AI-проверок"
          value="12"
          subtitle="в этом месяце"
          icon={CheckCircle2}
        />
        <DashboardCard
          title="Документов"
          value="8"
          subtitle="в хранилище"
          icon={FileText}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent matched grants */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel>AI-подбор</SectionLabel>
              <h2 className="font-bold text-funding-black">Подходящие гранты</h2>
            </div>
            <Link
              href="/dashboard/grants"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "#008A2E" }}
            >
              Все гранты <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentGrants.map((g) => (
              <Link key={g.id} href={`/dashboard/grants/${g.id}`}>
                <GrantCard {...g} variant="light" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-funding-black">Мои заявки</h3>
              <Link href="/dashboard/tracker" className="text-xs font-semibold" style={{ color: "#008A2E" }}>
                Все →
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {recentApplications.map((app, i) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < recentApplications.length - 1 ? "1px solid #f3f4f6" : "none" }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs font-medium text-funding-black truncate">{app.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{app.updated}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="font-bold text-sm text-funding-black mb-3">Быстрые действия</h3>
            <div className="space-y-2">
              {[
                { label: "Найти гранты", href: "/dashboard/grants", icon: BookOpen },
                { label: "Проверить соответствие", href: "/dashboard/eligibility", icon: Target },
                { label: "Создать предложение", href: "/dashboard/ai-writer", icon: Sparkles },
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
