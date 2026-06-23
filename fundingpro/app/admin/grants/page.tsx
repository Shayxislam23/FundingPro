"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { BookOpen, Plus, Loader2, RefreshCcw, Pencil, X, Check } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Grant = {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  donor_id: string;
  donor_name: string | null;
  sectors: string[];
  country_scope: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
};

type Donor = { id: string; name: string; nameRu: string | null };

const emptyForm = {
  title: "",
  titleRu: "",
  description: "",
  donorId: "",
  sectors: "",
  countryScope: "Uzbekistan",
  amountMin: "",
  amountMax: "",
  deadline: "",
  sourceUrl: "",
  isActive: true,
  isFeatured: false,
};

export default function AdminGrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Grant | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reqGrantId, setReqGrantId] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<{ id: string; text: string; requirementType: string; required: boolean }[]>([]);
  const [newReqText, setNewReqText] = useState("");
  const [reqLoading, setReqLoading] = useState(false);

  const openRequirements = async (grantId: string) => {
    setReqGrantId(grantId);
    setReqLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/admin/grants/${grantId}/requirements`, { headers });
      const data = await res.json();
      setRequirements(data.data?.requirements ?? []);
    } catch {
      setRequirements([]);
    } finally {
      setReqLoading(false);
    }
  };

  const addRequirement = async () => {
    if (!reqGrantId || !newReqText.trim()) return;
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/admin/grants/${reqGrantId}/requirements`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ text: newReqText.trim() }),
    });
    if (res.ok) {
      setNewReqText("");
      await openRequirements(reqGrantId);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const [grantsRes, donorsRes] = await Promise.all([
        fetch(`/api/v1/admin/grants?${params}`, { headers }),
        fetch("/api/v1/admin/donors", { headers }),
      ]);

      const grantsJson = await grantsRes.json();
      const donorsJson = await donorsRes.json();

      if (!grantsRes.ok) throw new Error(grantsJson.error?.message ?? "Ошибка загрузки грантов");

      setGrants(grantsJson.data?.grants ?? []);
      setTotal(grantsJson.data?.total ?? 0);
      setDonors(donorsJson.data?.donors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, donorId: donors[0]?.id ?? "" });
    setShowForm(true);
  };

  const openEdit = (g: Grant) => {
    setEditing(g);
    setForm({
      title: g.title,
      titleRu: g.title_ru ?? "",
      description: g.description ?? "",
      donorId: g.donor_id,
      sectors: g.sectors.join(", "),
      countryScope: g.country_scope.join(", "),
      amountMin: g.amount_min != null ? String(g.amount_min) : "",
      amountMax: g.amount_max != null ? String(g.amount_max) : "",
      deadline: g.deadline ? g.deadline.slice(0, 10) : "",
      sourceUrl: "",
      isActive: g.is_active,
      isFeatured: g.is_featured,
    });
    setShowForm(true);
  };

  const saveGrant = async () => {
    if (!form.title.trim() || !form.donorId) return;
    setSaving(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: form.title,
        titleRu: form.titleRu || undefined,
        description: form.description || undefined,
        donorId: form.donorId,
        sectors: form.sectors.split(",").map((s) => s.trim()).filter(Boolean),
        countryScope: form.countryScope.split(",").map((s) => s.trim()).filter(Boolean),
        amountMin: form.amountMin ? Number(form.amountMin) : null,
        amountMax: form.amountMax ? Number(form.amountMax) : null,
        deadline: form.deadline || null,
        sourceUrl: form.sourceUrl || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      const res = await fetch(
        editing ? `/api/v1/admin/grants/${editing.id}` : "/api/v1/admin/grants",
        {
          method: editing ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Ошибка сохранения");

      setShowForm(false);
      setEditing(null);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>CMS</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Гранты
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "#008A2E" }}
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 mb-5 p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full max-w-md px-4 py-2 bg-funding-light-bg rounded-xl text-sm outline-none"
        />
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-funding-green/30 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-funding-black">{editing ? "Редактировать грант" : "Новый грант"}</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Название (EN) *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input placeholder="Название (RU)" value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <select value={form.donorId} onChange={(e) => setForm({ ...form, donorId: e.target.value })} className="px-3 py-2 rounded-xl border text-sm">
              <option value="">Выберите донора *</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>{d.nameRu ?? d.name}</option>
              ))}
            </select>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input placeholder="Сумма min ($)" value={form.amountMin} onChange={(e) => setForm({ ...form, amountMin: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input placeholder="Сумма max ($)" value={form.amountMax} onChange={(e) => setForm({ ...form, amountMax: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input placeholder="Секторы (через запятую)" value={form.sectors} onChange={(e) => setForm({ ...form, sectors: e.target.value })} className="px-3 py-2 rounded-xl border text-sm md:col-span-2" />
            <input placeholder="Страны (через запятую)" value={form.countryScope} onChange={(e) => setForm({ ...form, countryScope: e.target.value })} className="px-3 py-2 rounded-xl border text-sm md:col-span-2" />
            <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="px-3 py-2 rounded-xl border text-sm md:col-span-2 resize-none" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Активен
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Избранный
            </label>
          </div>
          <button
            onClick={saveGrant}
            disabled={saving}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "#008A2E" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Сохранить
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-funding-green" /></div>
      ) : grants.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm flex flex-col items-center gap-2">
          <BookOpen className="w-8 h-8 opacity-30" />
          Грантов нет. Добавьте первый или примените seed.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Название", "Донор", "Дедлайн", "Сумма", "Статус", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grants.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: i < grants.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-funding-black">{g.title_ru ?? g.title}</p>
                    {g.is_featured && <span className="text-[10px] text-funding-green font-semibold">★ Избранный</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{g.donor_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {g.deadline ? new Date(g.deadline).toLocaleDateString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {g.amount_min || g.amount_max ? `$${g.amount_min ?? 0}–${g.amount_max ?? "∞"}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={g.is_active ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#F3F4F6", color: "#6B7280" }}>
                      {g.is_active ? "Активен" : "Скрыт"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <button type="button" onClick={() => openRequirements(g.id)} className="px-2 py-1 rounded-lg text-[10px] font-semibold text-funding-green hover:bg-funding-light-green">
                      Требования
                    </button>
                    <button type="button" onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-funding-green">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reqGrantId && (
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-funding-black">Требования гранта</h2>
            <button type="button" onClick={() => setReqGrantId(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {reqLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-funding-green" />
          ) : (
            <>
              <ul className="space-y-2 mb-4">
                {requirements.length === 0 ? (
                  <li className="text-sm text-gray-400">Требований пока нет</li>
                ) : (
                  requirements.map((r) => (
                    <li key={r.id} className="text-sm text-gray-700 border-b border-gray-50 pb-2">
                      {r.text}
                    </li>
                  ))
                )}
              </ul>
              <div className="flex gap-2">
                <input
                  value={newReqText}
                  onChange={(e) => setNewReqText(e.target.value)}
                  placeholder="Новое требование..."
                  className="flex-1 px-3 py-2 rounded-xl border text-sm"
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#008A2E" }}
                >
                  Добавить
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
