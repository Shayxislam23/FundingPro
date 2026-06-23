"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Building2, Loader2, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Org = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  isVerified: boolean;
  memberCount: number;
  readinessScore: number;
  createdAt: string;
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const toggleVerified = async (orgId: string, verified: boolean) => {
    setVerifyingId(orgId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/verify`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (res.ok) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, isVerified: verified } : o))
        );
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/organizations", { headers });
      const json = await res.json();
      setOrgs(json.data?.organizations ?? []);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Управление</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Организации
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({orgs.length})</span>}
          </h1>
        </div>
        <button
          onClick={fetchOrgs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      {loading && orgs.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Организации появятся после регистрации пользователей</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Название", "Тип", "Страна", "Сектор", "Участники", "Готовность", "Верификация", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < orgs.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg">
                    <td className="px-4 py-3 text-sm font-medium text-funding-black">{o.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{o.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{o.country ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{o.sector ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{o.memberCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${o.readinessScore}%`, background: "#008A2E" }} />
                        </div>
                        <span className="text-xs text-gray-400">{o.readinessScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#008A2E" }}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Да
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Нет</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {verifyingId === o.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                      ) : o.isVerified ? (
                        <button
                          type="button"
                          onClick={() => toggleVerified(o.id, false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Снять
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleVerified(o.id, true)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-funding-green hover:underline"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Верифицировать
                        </button>
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
