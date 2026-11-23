"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";
import { SERVICE_APPLICANT_TYPES } from "@/lib/service-requests";

type Row = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  organizationName: string | null;
  applicantType: keyof typeof SERVICE_APPLICANT_TYPES | string;
  region: string | null;
  grantInterest: string | null;
  message: string | null;
  preferredLanguage: string | null;
  utmSource: string | null;
  status: string;
  notes: string | null;
  contactCount: number;
  createdAt: number;
};

const STATUSES: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  qualified: "Квалифицирована",
  won: "Клиент (оплата)",
  lost: "Отказ",
};

export default function AdminServiceRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/admin/service-requests${filter ? `?status=${filter}` : ""}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
      setRows(json.data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: { status?: string; notes?: string }) {
    const headers = await getAuthHeaders();
    await fetch("/api/v1/admin/service-requests", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    await load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Продажи</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Заявки под ключ</h1>
          <p className="text-sm text-gray-400 mt-1">Заявки с формы /business. Позвоните в течение рабочего дня.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["", "Все"], ...Object.entries(STATUSES)].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              filter === value ? "bg-funding-light-green border-funding-green/40 text-funding-green" : "bg-white border-gray-200 text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      {!loading && rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">Заявок пока нет.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <b>{r.fullName}</b>
                <span className="text-sm">{[r.phone, r.email].filter(Boolean).join(" · ")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                  {SERVICE_APPLICANT_TYPES[r.applicantType as keyof typeof SERVICE_APPLICANT_TYPES] ?? r.applicantType}
                </span>
                {r.region && <span className="text-xs text-gray-500">{r.region}</span>}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(r.createdAt).toLocaleString("ru-RU")}
                  {r.contactCount > 1 ? ` · обращений: ${r.contactCount}` : ""}
                </span>
              </div>
              {r.organizationName && <p className="text-sm text-gray-600 mt-1">{r.organizationName}</p>}
              {r.grantInterest && <p className="text-sm mt-2"><b>Нужно:</b> {r.grantInterest}</p>}
              {r.message && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{r.message}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <select
                  value={r.status}
                  onChange={(e) => void patch(r.id, { status: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                >
                  {Object.entries(STATUSES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <input
                  defaultValue={r.notes ?? ""}
                  placeholder="Заметка менеджера (сумма, договорённости)"
                  onBlur={(e) => {
                    if (e.target.value !== (r.notes ?? "")) void patch(r.id, { notes: e.target.value });
                  }}
                  className="flex-1 min-w-[200px] px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                />
                {r.preferredLanguage && <span className="text-xs text-gray-400">язык: {r.preferredLanguage}</span>}
                {r.utmSource && <span className="text-xs text-gray-400">источник: {r.utmSource}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
