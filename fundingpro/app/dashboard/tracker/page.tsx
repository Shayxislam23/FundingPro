"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { EmptyState } from "@/components/design/EmptyState";
import { BarChart3, Plus, Loader2, ChevronDown } from "lucide-react";

type ApplicationStatus =
  | "saved" | "preparing" | "drafting" | "ready" | "submitted"
  | "under_review" | "shortlisted" | "won" | "lost" | "reporting" | "closed";

type Application = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  grant: {
    id: string;
    title: string;
    title_ru: string | null;
    deadline: string | null;
    amount_min: number | null;
    amount_max: number | null;
    donor: { name: string | null; name_ru: string | null };
  };
};

const STATUS_LABELS: Record<string, string> = {
  saved: "Сохранено",
  preparing: "Подготовка",
  drafting: "Черновик",
  ready: "Готово",
  submitted: "Подана",
  under_review: "На рассмотрении",
  shortlisted: "Шортлист",
  won: "Получено",
  lost: "Отклонено",
  reporting: "Отчётность",
  closed: "Закрыто",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  saved: { bg: "#F3F4F6", color: "#6B7280" },
  preparing: { bg: "#FEF3C7", color: "#D97706" },
  drafting: { bg: "#DBEAFE", color: "#2563EB" },
  ready: { bg: "#D9F7DD", color: "#008A2E" },
  submitted: { bg: "#D9F7DD", color: "#008A2E" },
  under_review: { bg: "#FDE68A", color: "#92400E" },
  shortlisted: { bg: "#FEF3C7", color: "#D97706" },
  won: { bg: "#D9F7DD", color: "#008A2E" },
  lost: { bg: "#FEE2E2", color: "#DC2626" },
  reporting: { bg: "#DBEAFE", color: "#2563EB" },
  closed: { bg: "#F3F4F6", color: "#6B7280" },
};

function formatDeadline(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return "—";
  if (max) return `до $${max.toLocaleString()}`;
  return `от $${min!.toLocaleString()}`;
}

const NEXT_STATUSES: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  saved: ["preparing"],
  preparing: ["drafting"],
  drafting: ["ready"],
  ready: ["submitted"],
  submitted: ["under_review"],
  under_review: ["shortlisted", "lost"],
  shortlisted: ["won", "lost"],
  won: ["reporting"],
  reporting: ["closed"],
};

const FILTER_STATUSES: ApplicationStatus[] = [
  "saved", "preparing", "drafting", "ready", "submitted",
  "under_review", "shortlisted", "won", "lost",
];

export default function TrackerDashboard() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/v1/applications?${params}`);
      const data = await res.json();
      setApplications(data.data?.applications ?? []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setUpdatingId(id);
    setOpenMenuId(null);
    try {
      await fetch(`/api/v1/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchApplications();
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !["won", "lost", "closed"].includes(a.status)).length,
    won: applications.filter((a) => a.status === "won").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>CRM</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Трекер заявок</h1>
        </div>
        <Link
          href="/dashboard/grants"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "#008A2E" }}
        >
          <Plus className="w-4 h-4" />
          Добавить заявку
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего", value: stats.total, color: "#050505" },
          { label: "Активных", value: stats.active, color: "#008A2E" },
          { label: "Получено", value: stats.won, color: "#12B94F" },
          { label: "Шортлист", value: stats.shortlisted, color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={filterStatus === "all" ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
          >
            Все
          </button>
          {FILTER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={filterStatus === s ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Нет заявок"
          description="Начните с поиска подходящего гранта"
          action={
            <Link href="/dashboard/grants" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#008A2E" }}>
              Найти грант
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Грант / Донор", "Сумма", "Дедлайн", "Статус", "Обновлено", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app, i) => {
                  const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.saved;
                  const nextStatuses = NEXT_STATUSES[app.status];
                  return (
                    <tr
                      key={app.id}
                      style={{ borderBottom: i < applications.length - 1 ? "1px solid #f9fafb" : "none" }}
                      className="hover:bg-funding-light-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-funding-black">
                          {app.grant?.title_ru ?? app.grant?.title ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {app.grant?.donor?.name_ru ?? app.grant?.donor?.name ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatAmount(app.grant?.amount_min ?? null, app.grant?.amount_max ?? null)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDeadline(app.grant?.deadline ?? null)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={sc}>
                          {STATUS_LABELS[app.status] ?? app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(app.updated_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3 relative">
                        {updatingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                        ) : nextStatuses?.length ? (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-funding-green hover:opacity-80"
                            >
                              Статус <ChevronDown className="w-3 h-3" />
                            </button>
                            {openMenuId === app.id && (
                              <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-1 min-w-36">
                                {nextStatuses.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateStatus(app.id, s)}
                                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-funding-light-bg text-gray-700"
                                  >
                                    → {STATUS_LABELS[s]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
