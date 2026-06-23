"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { DashboardCard } from "@/components/design/DashboardCard";
import { CreditCard, TrendingUp, AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type PaymentReport = {
  integrationStatus: string;
  paymentsEnabled: boolean;
  message: string;
  stats: { totalPayments: number; pendingPayments: number; subscriptionRequests: number };
  commissionTiers: { range: string; platform: number; current?: boolean }[];
  payments: {
    id: string;
    userEmail: string | null;
    planName: string | null;
    amountUsd: number;
    platformShareUsd: number | null;
    createdAt: string;
    status: string;
    provider: string;
    providerRefId: string | null;
  }[];
  subscriptionRequests: {
    id: string;
    subject: string;
    userEmail: string | null;
    status: string;
    createdAt: string;
  }[];
};

export default function AdminPaymentsPage() {
  const [report, setReport] = useState<PaymentReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/payments", { headers });
      const json = await res.json();
      setReport(json.data ?? null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading && !report) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  if (!report) {
    return <p className="text-sm text-gray-500">Не удалось загрузить отчёт</p>;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Финансы</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Платежи и Revenue Share</h1>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div
        className="flex items-start gap-3 rounded-2xl p-5 mb-6 border"
        style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#EA580C" }} />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#9A3412" }}>
            Интеграция: {report.integrationStatus}
          </p>
          <p className="text-sm" style={{ color: "#C2410C" }}>{report.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Платежей всего" value={String(report.stats.totalPayments)} icon={CreditCard} />
        <DashboardCard title="Ожидают обработки" value={String(report.stats.pendingPayments)} icon={TrendingUp} />
        <DashboardCard title="Запросов тарифов" value={String(report.stats.subscriptionRequests)} icon={CreditCard} />
        <DashboardCard
          title="Обработка"
          value={report.paymentsEnabled ? "Вкл." : "Выкл."}
          icon={TrendingUp}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-funding-black mb-4">Шкала комиссий</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Транзакций/мес", "FundingPro %", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.commissionTiers.map((tier, i) => (
                <tr
                  key={i}
                  style={
                    tier.current
                      ? { background: "rgba(0,138,46,0.06)", borderBottom: "1px solid #f3f4f6" }
                      : { borderBottom: "1px solid #f9fafb" }
                  }
                >
                  <td className="px-4 py-3 text-sm font-medium text-funding-black">{tier.range}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#008A2E" }}>{tier.platform}%</td>
                  <td className="px-4 py-3">
                    {tier.current && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#D9F7DD", color: "#008A2E" }}>
                        Текущий
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-funding-black">Запросы на подключение тарифов</h2>
        </div>
        {report.subscriptionRequests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">Запросов пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Тема", "Пользователь", "Статус", "Дата"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.subscriptionRequests.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < report.subscriptionRequests.length - 1 ? "1px solid #f9fafb" : "none" }}>
                    <td className="px-4 py-3 text-sm text-funding-black">{r.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.userEmail ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FEF3C7", color: "#D97706" }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-funding-black">Записи платежей</h2>
        </div>
        {report.payments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">Платежей нет — интеграция не активна</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Пользователь", "Тариф", "Провайдер", "Сумма", "FundingPro", "Статус", "Дата"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.payments.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < report.payments.length - 1 ? "1px solid #f9fafb" : "none" }}>
                    <td className="px-4 py-3 text-sm text-funding-black">{p.userEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.planName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.provider}
                      {p.providerRefId ? (
                        <span className="block text-xs text-gray-400 truncate max-w-[120px]" title={p.providerRefId}>
                          {p.providerRefId}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-funding-green">${p.amountUsd}</td>
                    <td className="px-4 py-3 text-sm text-funding-green">
                      {p.platformShareUsd != null ? `$${p.platformShareUsd}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FEF3C7", color: "#D97706" }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
