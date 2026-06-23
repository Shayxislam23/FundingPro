"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Building2, Loader2, CheckCircle2, Pencil } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { SECTOR_OPTIONS, translateSector } from "@/lib/sector-labels";
import { trackEvent } from "@/lib/analytics";

type Organization = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  role: string;
  isVerified: boolean;
};

const ORG_TYPES = [
  { value: "NGO", label: "НКО" },
  { value: "BUSINESS", label: "Бизнес" },
  { value: "ACADEMIC", label: "Университет / школа" },
  { value: "GOVERNMENT", label: "Государственная организация" },
  { value: "INDIVIDUAL", label: "Частное лицо" },
];

export default function ProfilePage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("NGO");
  const [country, setCountry] = useState("Uzbekistan");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");

  function applyOrg(organization: Organization) {
    setOrg(organization);
    setName(organization.name);
    setType(organization.type);
    setCountry(organization.country ?? "Uzbekistan");
    setSector(organization.sector ?? "");
  }

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/organizations", { headers });
        const data = await res.json();
        const organization = data.data?.organization as Organization | null;
        if (organization) applyOrg(organization);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const headers = await getAuthHeaders();
      const isUpdate = !!org;
      const res = await fetch("/api/v1/organizations", {
        method: isUpdate ? "PATCH" : "POST",
        headers,
        body: JSON.stringify({ name, type, country, sector, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? data.error ?? "Не удалось сохранить профиль");
        return;
      }
      const organization = data.data?.organization as Organization;
      applyOrg(organization);
      setEditing(false);
      setSaved(true);
      trackEvent(isUpdate ? "profile_updated" : "onboarding_step_profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  const showForm = !org || editing;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <SectionLabel>Профиль</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Организация</h1>
        <p className="text-sm text-gray-500 mt-1">
          Профиль используется для AI-подбора грантов и проверки соответствия.
        </p>
      </div>

      {org && !editing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-funding-light-green flex items-center justify-center">
                <Building2 className="w-5 h-5 text-funding-green" />
              </div>
              <div>
                <p className="font-semibold text-funding-black">{org.name}</p>
                <p className="text-xs text-gray-500">
                  {ORG_TYPES.find((t) => t.value === org.type)?.label ?? org.type} · {org.country ?? "—"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-semibold text-funding-green hover:underline"
            >
              <Pencil className="w-3.5 h-3.5" /> Изменить
            </button>
          </div>
          {org.sector && (
            <p className="text-sm text-gray-600">Сектор: {translateSector(org.sector)}</p>
          )}
          {description && <p className="text-sm text-gray-600">{description}</p>}
          <p className="text-xs text-gray-400">
            Роль: {org.role} · Верификация: {org.isVerified ? "подтверждена" : "не подтверждена"}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
          {saved && (
            <p className="text-sm text-funding-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Профиль сохранён
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Название</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              placeholder="ЭкоНКО Узбекистан"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Страна</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Сектор</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            >
              <option value="">Выберите сектор</option>
              {SECTOR_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
              placeholder="Кратко опишите миссию и опыт организации"
            />
          </div>

          <div className="flex gap-2">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  if (org) applyOrg(org);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600"
              >
                Отмена
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#008A2E" }}
            >
              {saving ? "Сохранение..." : org ? "Сохранить изменения" : "Создать профиль организации"}
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-gray-400 mt-6 leading-relaxed">
        FundingPro не гарантирует получение гранта. Платформа помогает найти возможности, проверить требования и подготовить заявку.
      </p>
    </div>
  );
}
