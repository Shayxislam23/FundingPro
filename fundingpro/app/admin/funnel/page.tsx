"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import {
  TrendingUp,
  Loader2,
  RefreshCcw,
  Users,
  Building2,
  Bookmark,
  FileCheck,
  CreditCard,
  Target,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type FunnelData = {
  signups: number;
  withOrg: number;
  withSavedGrant: number;
  withApplication: number;
  withSubscription: number;
  conversionRate: number;
  labParticipants: number;
  withVerifiedApplication: number;
  northStarRate: number;
};

const STEPS = [
  { key: "signups" as const, label: "Регистрации", icon: Users, color: "#6B7280" },
  { key: "withOrg" as const, label: "С организацией / профилем", icon: Building2, color: "#008A2E" },
  { key: "withSavedGrant" as const, label: "Сохранённый грант", icon: Bookmark, color: "#047857" },
  { key: "withApplication" as const, label: "Есть заявка", icon: FileCheck, color: "#6366F1" },
  { key: "withSubscription" as const, label: "Активная подписка", icon: CreditCard, color: "#D97706" },
];

export default function AdminFunnelPage() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOnly, setRecentOnly] = useState(false);

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = recentOnly ? "?recent30d=true" : "";
      const res = await fetch(`/api/v1/admin/funnel${params}`, { headers });
      const data = await res.json();
      setFunnel(data.data?.funnel ?? null);
    } catch {
      setFunnel(null);
    } finally {
      setLoading(false);
    }
  }, [recentOnly]);

  useEffect(() => {
    void fetchFunnel();
  }, [fetchFunnel]);

  const northStarPct = funnel ? Math.round(funnel.northStarRate * 1000) / 10 : 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Рост</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Воронка + North Star</h1>
          <p className="text-sm text-gray-500 mt-1">
            Уникальные пользователи на каждом этапе
            {recentOnly && " · регистрации за 30 дней"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={recentOnly}
              onChange={(e) => setRecentOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            За 30 дней
          </label>
          <button
            onClick={fetchFunnel}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Обновить
          </button>
        </div>
      </div>

      {loading && !funnel ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : funnel ? (
        <>
          <div className="bg-white rounded-2xl border border-funding-green/30 p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-funding-green" />
              <h2 className="font-bold text-funding-black">North Star — «Мой путь»</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Доля участников «Мой путь» с proof заявки (`submitted` / `completed`). Цель: 20% → 35% →
              50% (см. STARTUP_SURVIVAL_PLAN.md и FAILURE_MODES_100.md #2).
            </p>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-black text-funding-green">{northStarPct}%</div>
                <div className="text-xs text-gray-400 mt-1">northStarRate</div>
              </div>
              <div>
                <div className="text-3xl font-black text-funding-black">{funnel.labParticipants}</div>
                <div className="text-xs text-gray-400 mt-1">lab participants</div>
              </div>
              <div>
                <div className="text-3xl font-black text-funding-black">
                  {funnel.withVerifiedApplication}
                </div>
                <div className="text-xs text-gray-400 mt-1">с proof заявки</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {STEPS.map(({ key, label, icon: Icon, color }, index) => {
              const value = funnel[key];
              const prevKey = index > 0 ? STEPS[index - 1].key : null;
              const prevValue = prevKey ? funnel[prevKey] : null;
              const stepRate =
                prevKey && prevValue && prevValue > 0
                  ? Math.round((value / prevValue) * 1000) / 10
                  : null;

              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}18` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    {index > 0 && stepRate !== null && (
                      <span className="text-xs font-semibold text-gray-400 ml-auto">
                        {stepRate}% от пред.
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black mb-1" style={{ color }}>
                    {value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-funding-green" />
              <span className="text-sm font-semibold text-funding-black">
                Конверсия регистрация → подписка:{" "}
                {(Math.round(funnel.conversionRate * 1000) / 10).toFixed(1)}%
              </span>
            </div>
            <div className="space-y-3">
              {STEPS.map(({ key, label, color }) => {
                const value = funnel[key];
                const width = funnel.signups > 0 ? Math.max(4, (value / funnel.signups) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${width}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 py-12 text-center">Не удалось загрузить воронку</p>
      )}
    </div>
  );
}
