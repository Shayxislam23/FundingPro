"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ShieldCheck, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Consent = {
  id: string;
  userId: string;
  userEmail: string | null;
  consentType: string;
  documentVersion: string;
  acceptedAt: string;
  locale: string;
};

const CONSENT_LABELS: Record<string, string> = {
  terms: "Оферта",
  privacy: "Конфиденциальность",
  ai: "AI-обработка",
  refunds: "Возвраты",
  success_fee: "Success fee",
};

export default function AdminConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/consents?limit=50", { headers });
      const data = await res.json();
      setConsents(data.data?.consents ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setConsents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Рост</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Согласия пользователей
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
        </div>
        <button
          onClick={fetchConsents}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : consents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Согласий пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Пользователь", "Тип", "Версия", "Язык", "Дата"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consents.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < consents.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]">
                      {c.userEmail ?? c.userId.slice(0, 8) + "…"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-funding-black">
                      {CONSENT_LABELS[c.consentType] ?? c.consentType}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.documentVersion}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 uppercase">{c.locale}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(c.acceptedAt).toLocaleString("ru-RU")}
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
