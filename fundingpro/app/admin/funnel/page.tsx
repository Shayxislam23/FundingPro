"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { TrendingUp, Loader2, RefreshCcw, Users, Building2, CheckCircle2, Bot, CreditCard } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type FunnelData = {
  totalUsers: number;
  withOrganization: number;
  eligibilityChecks: number;
  aiProposals: number;
  paidSubscriptions: number;
  conversionRates: {
    organization: number;
    eligibility: number;
    aiProposal: number;
    paid: number;
  };
  scopedToRecentSignups: boolean;
};

const STEPS = [
  { key: "totalUsers" as const, label: "Всего пользователей", icon: Users, color: "#6B7280", rateKey: null },
  { key: "withOrganization" as const, label: "С организацией", icon: Building2, color: "#008A2E", rateKey: "organization" as const },
  { key: "eligibilityChecks" as const, label: "Проверка eligibility", icon: CheckCircle2, color: "#047857", rateKey: "eligibility" as const },
  { key: "aiProposals" as const, label: "AI-заявки", icon: Bot, color: "#6366F1", rateKey: "aiProposal" as const },
  { key: "paidSubscriptions" as const, label: "Оплаченные подписки", icon: CreditCard, color: "#D97706", rateKey: "paid" as const },
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

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Рост</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Воронка активации</h1>
          <p className="text-sm text-gray-500 mt-1">
            Уникальные пользователи на каждом этапе
            {funnel?.scopedToRecentSignups && " · регистрации за 30 дней"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {STEPS.map(({ key, label, icon: Icon, color, rateKey }, index) => {
              const value = funnel[key];
              const rate = rateKey ? funnel.conversionRates[rateKey] : null;
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
                  {rate !== null && (
                    <div className="text-xs text-gray-400 mt-2">{rate}% от всех</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-funding-green" />
              <h2 className="font-bold text-funding-black text-sm">Визуализация воронки</h2>
            </div>
            <div className="space-y-3">
              {STEPS.slice(1).map(({ key, label, color }) => {
                const value = funnel[key];
                const width = funnel.totalUsers > 0 ? Math.max(4, (value / funnel.totalUsers) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold" style={{ color }}>
                        {value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Не удалось загрузить данные</p>
        </div>
      )}
    </div>
  );
}
