"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { HelpCircle, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  userEmail: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

const NEXT_STATUS: Record<string, string> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/v1/admin/support-tickets?${params}`, { headers });
      const data = await res.json();
      setTickets(data.data?.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const advanceStatus = async (ticket: Ticket) => {
    const next = NEXT_STATUS[ticket.status];
    if (!next) return;
    setUpdatingId(ticket.id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/admin/support-tickets/${ticket.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) await fetchTickets();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Поддержка</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Тикеты</h1>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={filter === s ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
          >
            {s === "all" ? "Все" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-funding-green" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm flex flex-col items-center gap-2">
          <HelpCircle className="w-8 h-8 opacity-30" />
          Тикетов нет
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-semibold text-sm text-funding-black">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.userEmail ?? "—"} · {new Date(t.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0" style={{ background: "#FEF3C7", color: "#D97706" }}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{t.message}</p>
              {NEXT_STATUS[t.status] && (
                <button
                  onClick={() => advanceStatus(t)}
                  disabled={updatingId === t.id}
                  className="text-xs font-semibold text-funding-green hover:opacity-80 disabled:opacity-40"
                >
                  {updatingId === t.id ? "..." : `→ ${STATUS_LABELS[NEXT_STATUS[t.status]]}`}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
