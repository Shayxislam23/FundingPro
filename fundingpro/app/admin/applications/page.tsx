"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ClipboardList, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { getStatusLabel, getStatusStyle } from "@/lib/application-status";

type Application = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string | null;
  organizationName: string | null;
  grant: {
    id: string;
    title: string;
    titleRu: string | null;
    donorName: string | null;
  } | null;
};

const STATUS_FILTERS = [
  { value: "", label: "Все" },
  { value: "saved", label: "Сохранено" },
  { value: "preparing", label: "Подготовка" },
  { value: "submitted", label: "Подана" },
  { value: "won", label: "Получено" },
  { value: "lost", label: "Отклонено" },
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/v1/admin/applications?${params}`, { headers });
      const data = await res.json();
      setApplications(data.data?.applications ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Рост</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Заявки
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setStatusFilter(value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={
                statusFilter === value
                  ? { background: "#008A2E", color: "#fff" }
                  : { background: "#F3F4F6", color: "#6B7280" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Заявок нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Грант", "Пользователь", "Организация", "Статус", "Обновлено"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app, i) => {
                  const style = getStatusStyle(app.status);
                  const grantTitle = app.grant?.titleRu ?? app.grant?.title ?? "—";
                  return (
                    <tr
                      key={app.id}
                      style={{ borderBottom: i < applications.length - 1 ? "1px solid #f9fafb" : "none" }}
                      className="hover:bg-funding-light-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-funding-black truncate max-w-[200px]">{grantTitle}</p>
                        {app.grant?.donorName && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{app.grant.donorName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[180px]">
                        {app.userEmail ?? app.userId.slice(0, 8) + "…"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[140px]">
                        {app.organizationName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(app.updatedAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
