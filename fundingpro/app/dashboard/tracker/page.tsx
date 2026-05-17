"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { StatusBadge } from "@/components/design/StatusBadge";
import { EmptyState } from "@/components/design/EmptyState";
import { BarChart3, Plus, Loader2, ChevronDown } from "lucide-react";

type ApplicationStatus =
  | "SAVED" | "PREPARING" | "DRAFTING" | "READY" | "SUBMITTED"
  | "UNDER_REVIEW" | "SHORTLISTED" | "WON" | "LOST" | "REPORTING" | "CLOSED";

type Application = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  grant: {
    id: string;
    title: string;
    deadline: string | null;
    amountMin: string | null;
    amountMax: string | null;
    currency: string;
    donor: { shortName: string | null };
  };
};

const STATUS_FILTER_LABELS: Partial<Record<ApplicationStatus, string>> = {
  SAVED: "Сохранено",
  PREPARING: "Подготовка",
  DRAFTING: "Черновик",
  READY: "Готово",
  SUBMITTED: "Подана",
  UNDER_REVIEW: "На рассмотрении",
  SHORTLISTED: "Шортлист",
  WON: "Получено",
  LOST: "Отклонено",
};

const STATUS_DISPLAY: Record<string, string> = {
  SAVED: "Сохранено",
  PREPARING: "Подготовка",
  DRAFTING: "Черновик",
  READY: "Готово",
  SUBMITTED: "Подана",
  UNDER_REVIEW: "На рассмотрении",
  SHORTLISTED: "Шортлист",
  WON: "Получено",
  LOST: "Отклонено",
  REPORTING: "Отчётность",
  CLOSED: "Закрыто",
};

function formatDeadline(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatAmount(min: string | null, max: string | null, currency: string) {
  if (!min && !max) return "—";
  if (max) return `до ${currency} ${Number(max).toLocaleString()}`;
  return `${currency} ${Number(min).toLocaleString()}+`;
}

const NEXT_STATUSES: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SAVED: ["PREPARING"],
  PREPARING: ["DRAFTING"],
  DRAFTING: ["READY"],
  READY: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["SHORTLISTED", "LOST"],
  SHORTLISTED: ["WON", "LOST"],
  WON: ["REPORTING"],
  REPORTING: ["CLOSED"],
};

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
    active: applications.filter((a) => !["WON", "LOST", "CLOSED"].includes(a.status)).length,
    won: applications.filter((a) => a.status === "WON").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
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
          {Object.entries(STATUS_FILTER_LABELS).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={filterStatus === s ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
            >
              {label}
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
                {applications.map((app, i) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: i < applications.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-funding-black">{app.grant.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.grant.donor.shortName ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatAmount(app.grant.amountMin, app.grant.amountMax, app.grant.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDeadline(app.grant.deadline)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                        {STATUS_DISPLAY[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(app.updatedAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3 relative">
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                      ) : NEXT_STATUSES[app.status]?.length ? (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-funding-green hover:opacity-80"
                          >
                            Статус <ChevronDown className="w-3 h-3" />
                          </button>
                          {openMenuId === app.id && (
                            <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-1 min-w-36">
                              {NEXT_STATUSES[app.status]!.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(app.id, s)}
                                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-funding-light-bg text-gray-700"
                                >
                                  → {STATUS_DISPLAY[s]}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
