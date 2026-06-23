"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "@/components/design/DashboardCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Users, BookOpen, BarChart3, Bot, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type AdminData = {
  totalUsers: number;
  totalOrganizations: number;
  totalGrants: number;
  totalApplications: number;
  totalSupportTickets: number;
  activeSubscriptions: number;
  aiRequestsThisMonth: number;
  openTickets: number;
  subscriptionRequests?: number;
  recentUsers: { id: string; email: string | null; createdAt: string }[];
  integrationStatus: { payments: string; paymentsEnabled: boolean; aiProvider: string };
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/dashboard", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Администрирование</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Панель управления</h1>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : data ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard
              title="Пользователей"
              value={data.totalUsers.toLocaleString()}
              icon={Users}
            />
            <DashboardCard
              title="Грантов в базе"
              value={data.totalGrants.toLocaleString()}
              icon={BookOpen}
            />
            <DashboardCard
              title="Заявок всего"
              value={data.totalApplications.toLocaleString()}
              icon={BarChart3}
            />
            <DashboardCard
              title="AI-запросов (месяц)"
              value={data.aiRequestsThisMonth.toLocaleString()}
              icon={Bot}
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Организаций", value: data.totalOrganizations, color: "#008A2E" },
              { label: "Запросов тарифов", value: data.subscriptionRequests ?? 0, color: "#6366F1" },
              { label: "Активных подписок", value: data.activeSubscriptions, color: "#008A2E" },
              { label: "Открытых тикетов", value: data.openTickets, color: "#D97706" },
              { label: "Тикетов всего", value: data.totalSupportTickets, color: "#6B7280" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-3xl font-black mb-1" style={{ color }}>{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Recent users */}
          {data.recentUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-funding-black mb-3 text-sm">Последние регистрации</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {data.recentUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-funding-light-bg transition-colors"
                    style={{ borderBottom: i < data.recentUsers.length - 1 ? "1px solid #f3f4f6" : "none" }}
                  >
                    <p className="text-sm font-medium text-funding-black truncate">{u.email ?? "—"}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-3">
                      {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration status */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">
                Платёжная интеграция: {data.integrationStatus.payments}
              </p>
              <p className="text-xs text-amber-700">
                AI провайдер: <strong>{data.integrationStatus.aiProvider}</strong> ·
                Платежи: {data.integrationStatus.paymentsEnabled ? "включены" : "не подключены"}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
