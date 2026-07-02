"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { OrgOnboardingBanner } from "@/components/design/OrgOnboardingBanner";
import { OnboardingChecklist } from "@/components/design/OnboardingChecklist";
import { LabJourneySummaryCard } from "@/components/lab/LabJourneySummaryCard";
import { ReconsentBanner } from "@/components/legal/ReconsentBanner";
import { BookOpen, BarChart3, CheckCircle2, FileText, ArrowRight, Sparkles, Target, Loader2, Building2 } from "lucide-react";
import { translateSector } from "@fundingpro/shared";
import { getAuthHeaders } from "@/lib/client-auth";
import { formatGrantAmount, formatDeadlineDate, getDeadlineUrgency } from "@fundingpro/shared";
import { getStatusLabel, getStatusStyle } from "@/lib/application-status";
import type { OnboardingStepId } from "@/lib/db/onboarding";

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

export default function DashboardHome() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalGrants, setTotalGrants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<Record<OnboardingStepId, boolean> | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState({ completed: 0, total: 5 });

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const [grantsData, appsData, meData, onboardingData] = await Promise.all([
          fetch("/api/v1/grants?limit=4").then((r) => r.json()),
          fetch("/api/v1/applications?limit=3", { headers }).then((r) => r.json()),
          fetch("/api/v1/me", { headers }).then((r) => r.json()),
          fetch("/api/v1/onboarding/status", { headers }).then((r) => r.json()),
        ]);
        setGrants(grantsData.data?.grants ?? []);
        setTotalGrants(grantsData.data?.total ?? 0);
        setApplications(appsData.data?.applications ?? []);
        setHasOrganization(!!meData.data?.organization);
        setOrgName(meData.data?.organization?.name ?? null);
        if (onboardingData.data?.steps) {
          setOnboardingSteps(onboardingData.data.steps);
          setOnboardingProgress({
            completed: onboardingData.data.completedCount ?? 0,
            total: onboardingData.data.totalSteps ?? 5,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-funding-black mb-1">
            {orgName ? `Добро пожаловать, ${orgName}` : "Добро пожаловать"}
          </h1>
          <p className="text-sm text-gray-500">
            {totalGrants} грантов в базе
            {onboardingProgress.completed < onboardingProgress.total
              ? ` · ${onboardingProgress.completed}/${onboardingProgress.total} шагов онбординга`
              : " · обновлено сегодня"}
          </p>
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

      <ReconsentBanner />

      {!hasOrganization && <OrgOnboardingBanner />}

      {onboardingSteps && (
        <OnboardingChecklist
          steps={onboardingSteps}
          completedCount={onboardingProgress.completed}
          totalSteps={onboardingProgress.total}
        />
      )}

      <LabJourneySummaryCard />

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
                    amount={formatGrantAmount(g.amount_min, g.amount_max)}
                    deadline={formatDeadlineDate(g.deadline)}
                    deadlineUrgency={getDeadlineUrgency(g.deadline)}
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
                  const sc = getStatusStyle(app.status);
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
                        {getStatusLabel(app.status)}
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
                { label: "Профиль организации", href: "/dashboard/profile", icon: Building2 },
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
