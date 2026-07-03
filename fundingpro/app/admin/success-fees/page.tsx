"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { DashboardCard } from "@/components/design/DashboardCard";
import { DollarSign, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type FeeRecord = {
  id: string;
  userEmail: string | null;
  grantTitle: string | null;
  wonAmountUsd: number;
  feePercent: number;
  feeAmountUsd: number;
  status: string;
  createdAt: string;
};

type FeeStatus = "pending" | "invoiced" | "paid" | "waived";

const STATUS_LABELS: Record<FeeStatus, string> = {
  pending: "Ожидает",
  invoiced: "Выставлен счёт",
  paid: "Оплачено",
  waived: "Списано",
};

export default function AdminSuccessFeesPage() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | FeeStatus>("all");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/v1/admin/success-fees${qs}`, { headers });
      const json = await res.json();
      setRecords(json.data?.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const updateStatus = async (id: string, status: FeeStatus) => {
    setSavingId(id);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/v1/admin/success-fees/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchRecords();
    } finally {
      setSavingId(null);
    }
  };

  const totalPending = records
    .filter((r) => r.status === "pending" || r.status === "invoiced")
    .reduce((sum, r) => sum + r.feeAmountUsd, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Монетизация</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Success fee</h1>
          <p className="text-sm text-gray-400 mt-1">2–5% от суммы выигранного гранта, по договору</p>
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          icon={DollarSign}
          title="К оплате (ожидает + выставлено)"
          value={`$${totalPending.toLocaleString("en-US")}`}
        />
        <DashboardCard icon={DollarSign} title="Записей всего" value={String(records.length)} />
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "pending", "invoiced", "paid", "waived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === s
                ? "bg-funding-light-green border-funding-green/40 text-funding-green"
                : "bg-white border-gray-200 text-gray-500 hover:border-funding-green/40"
            }`}
          >
            {s === "all" ? "Все" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Записей нет. Появятся, когда заявка получит статус «Получено» с указанной суммой.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Пользователь", "Грант", "Сумма гранта", "% / Сумма fee", "Статус", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < records.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg">
                  <td className="px-4 py-3 text-sm text-gray-600">{r.userEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-funding-black">{r.grantTitle ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">${r.wonAmountUsd.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-funding-green">
                    {r.feePercent}% · ${r.feeAmountUsd.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => updateStatus(r.id, e.target.value as FeeStatus)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                    >
                      {(Object.keys(STATUS_LABELS) as FeeStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{savingId === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-funding-green" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
