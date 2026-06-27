"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, MapPin, DollarSign, FileText, ArrowLeft, Loader2, Plus, AlertTriangle } from "lucide-react";
import { translateSector } from "@fundingpro/shared";
import { getAuthHeaders } from "@/lib/client-auth";

type Grant = {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  description_ru: string | null;
  sectors: string[];
  country_scope: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  donor: { id: string; name: string; name_ru: string | null; website: string | null };
  grant_requirements: { id: string; requirement_type: string; text: string; required: boolean }[];
};

const TODAY = new Date();

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return "Сумма не указана";
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (max) return `до $${max.toLocaleString()}`;
  return `от $${min!.toLocaleString()}`;
}

function formatDeadline(d: string | null) {
  if (!d) return { text: "Не указан", expired: false };
  const date = new Date(d);
  return {
    text: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }),
    expired: date < TODAY,
  };
}

export default function GrantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/grants/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGrant(d.data);
        else setError("Грант не найден");
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers,
        body: JSON.stringify({ grantId: id }),
      });
      if (res.ok) setApplied(true);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
    </div>
  );

  if (error || !grant) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">{error || "Грант не найден"}</p>
      <Link href="/dashboard/grants" className="text-sm font-semibold text-funding-green">← К списку</Link>
    </div>
  );

  const dl = formatDeadline(grant.deadline);
  const title = grant.title_ru ?? grant.title;
  const description = grant.description_ru ?? grant.description;
  const donorName = grant.donor.name_ru ?? grant.donor.name;
  const sectors = grant.sectors.map(translateSector);

  return (
    <div>
      <Link href="/dashboard/grants" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-funding-green mb-5">
        <ArrowLeft className="w-3.5 h-3.5" />
        К списку грантов
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {dl.expired && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700 font-medium">Дедлайн этого гранта истёк. Информация может быть устаревшей.</span>
              </div>
            )}
            <h1 className="text-xl font-black text-funding-black mb-2">{title}</h1>
            <p className="font-semibold text-funding-green">{donorName}</p>
            {sectors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {sectors.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-funding-light-green text-funding-green">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-funding-black mb-3">О гранте</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Requirements */}
          {grant.grant_requirements?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-funding-black mb-4">Требования</h2>
              <ul className="space-y-3">
                {grant.grant_requirements.map((req) => (
                  <li key={req.id} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-funding-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{req.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-sm text-funding-black mb-4">Ключевые данные</h3>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: "Сумма", value: formatAmount(grant.amount_min, grant.amount_max) },
                { icon: Calendar, label: "Дедлайн", value: dl.text, warn: dl.expired },
                { icon: MapPin, label: "Страна", value: grant.country_scope.join(", ") || "—" },
                { icon: FileText, label: "Сектор", value: sectors[0] ?? "—" },
              ].map(({ icon: Icon, label, value, warn }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#D9F7DD" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "#008A2E" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                    <p className={`text-sm font-medium ${warn ? "text-amber-600" : "text-funding-black"}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleApply}
              disabled={applying || applied}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
              style={{ background: "#008A2E" }}
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {applied ? "Добавлено в трекер" : "Добавить в трекер"}
            </button>
            <Link href={`/dashboard/eligibility?grantId=${grant.id}`}
              className="block w-full py-3 rounded-xl font-semibold text-sm text-center border"
              style={{ borderColor: "#008A2E", color: "#008A2E" }}
            >
              Проверить соответствие
            </Link>
            <Link href={`/dashboard/ai-writer?grantId=${grant.id}`}
              className="block w-full py-3 rounded-xl font-semibold text-sm text-center border border-gray-200 text-gray-600 hover:border-funding-green hover:text-funding-green transition-colors"
            >
              Создать AI-предложение
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
