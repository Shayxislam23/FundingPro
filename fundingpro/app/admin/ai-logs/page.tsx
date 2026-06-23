"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Shield, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type AILog = {
  id: string;
  user_id: string;
  user_email?: string | null;
  action: string;
  model: string;
  tokens: number;
  pii_redacted: boolean;
  status?: string;
  created_at: string;
};

export default function AILogsPage() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/ai-logs?limit=30", { headers });
      const data = await res.json();
      setLogs(data.data?.logs ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>AI-система</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            AI-запросы
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Журнал AI-запросов из таблицы ai_requests</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background: "#D9F7DD" }}>
        <Shield className="w-4 h-4 text-funding-green flex-shrink-0 mt-0.5" />
        <p className="text-xs text-funding-text-muted-light leading-relaxed">
          Персональные данные редактируются перед отправкой внешним AI-провайдерам.
          Без API-ключа используется MockProvider.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          AI-запросов ещё нет. Запустите проверку соответствия или AI-черновик.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Пользователь", "Тип", "Модель", "Токены", "ПД", "Статус", "Дата"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: i < logs.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg"
                  >
                    <td className="px-4 py-3 text-sm text-funding-black">{log.user_email ?? log.user_id.slice(0, 8) + "…"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.model}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{Number(log.tokens).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={log.pii_redacted ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#F3F4F6", color: "#6B7280" }}
                      >
                        {log.pii_redacted ? "Да" : "Нет"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.status ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString("ru-RU")}
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
