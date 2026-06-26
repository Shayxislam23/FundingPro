"use client";

import { useState, useEffect } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Search, UserCheck, UserX, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  user_metadata: Record<string, unknown>;
};

async function getAdminHeaders(): Promise<Record<string, string>> {
  return getAuthHeaders();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    setDeactivatingId(userId);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setDeactivatingId(null);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/v1/admin/users?limit=50", { headers });
      const data = await res.json();
      setUsers(data.data?.users ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Управление</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Пользователи
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email..."
              className="w-full pl-9 pr-4 py-2 bg-funding-light-bg rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Пользователей нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Пользователь", "Email", "Подтверждён", "Последний вход", "Дата регистрации", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const name = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "");
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }}
                      className="hover:bg-funding-light-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-funding-green text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {(name || u.email || "?")[0].toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-funding-black truncate max-w-[120px]">
                            {name || <span className="text-gray-400 italic text-xs">—</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[180px]">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={u.email_confirmed ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                        >
                          {u.email_confirmed ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.email_confirmed ? "Да" : "Нет"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        {deactivatingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleUserActive(u.id, false)}
                            className="text-xs font-semibold text-red-500 hover:underline"
                          >
                            Деактивировать
                          </button>
                        )}
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
