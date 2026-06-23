"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Landmark, Plus, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Donor = { id: string; name: string; nameRu: string | null };

export default function AdminDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/donors", { headers });
      const data = await res.json();
      setDonors(data.data?.donors ?? []);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/donors", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameRu: nameRu.trim() || undefined }),
      });
      if (res.ok) {
        setName("");
        setNameRu("");
        await fetchDonors();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Справочник</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Доноры</h1>
        </div>
        <button
          type="button"
          onClick={fetchDonors}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-funding-green" />
          <h2 className="font-bold text-sm text-funding-black">Добавить донора</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (EN)"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
            required
          />
          <input
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="Название (RU)"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#008A2E" }}
        >
          {saving ? "Сохранение..." : "Создать"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Доноров нет</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Название", "Название (RU)"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donors.map((d, i) => (
                <tr
                  key={d.id}
                  style={{ borderBottom: i < donors.length - 1 ? "1px solid #f9fafb" : "none" }}
                  className="hover:bg-funding-light-bg"
                >
                  <td className="px-4 py-3 text-sm font-medium text-funding-black">
                    <span className="inline-flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-funding-green" />
                      {d.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.nameRu ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
