"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Briefcase, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Order = {
  id: string;
  packageName: string;
  amountUsd: number;
  status: string;
  clientEmail: string | null;
  consultantName: string;
  createdAt: string;
};

const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminConsultantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/consultant-orders", { headers });
      const data = await res.json();
      setOrders(data.data?.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/consultant-orders", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) await fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Консультанты</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Заказы консультаций</h1>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Заказов нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Клиент", "Консультант", "Пакет", "Сумма", "Статус", "Дата", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    style={{ borderBottom: i < orders.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">{o.clientEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{o.consultantName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-funding-black">{o.packageName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${o.amountUsd}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-funding-light-green text-funding-green">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3">
                      {updatingId === o.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                      ) : (
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
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
