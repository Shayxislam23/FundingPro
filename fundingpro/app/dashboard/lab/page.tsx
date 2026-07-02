"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  GraduationCap,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";
import type { LabJourney, LabStepState } from "@/lib/db/lab";
import {
  LAB_CERT_REQUIREMENTS,
  LAB_INTERESTS,
  LAB_STATE_LABELS,
  LAB_STEPS,
} from "@/components/lab/labSteps";

function StepIcon({ state }: { state: LabStepState }) {
  if (state === "completed" || state === "submitted") {
    return <CheckCircle2 className="w-5 h-5 text-funding-green flex-shrink-0" />;
  }
  if (state === "needs_revision") {
    return <RotateCcw className="w-5 h-5 text-amber-500 flex-shrink-0" />;
  }
  if (state === "in_progress") {
    return <Clock className="w-5 h-5 text-funding-green/60 flex-shrink-0" />;
  }
  return <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
}

export default function LabJourneyPage() {
  const [journey, setJourney] = useState<LabJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    city: "",
    telegram: "",
    educationStatus: "",
    linkedinUrl: "",
    interests: [] as string[],
  });

  const fetchJourney = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/lab/journey", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Ошибка загрузки");
      const data = json.data as LabJourney;
      setJourney(data);
      setForm({
        fullName: data.profile.fullName ?? "",
        age: data.profile.age != null ? String(data.profile.age) : "",
        city: data.profile.city ?? "",
        telegram: data.profile.telegram ?? "",
        educationStatus: data.profile.educationStatus ?? "",
        linkedinUrl: data.profile.linkedinUrl ?? "",
        interests: data.profile.interests,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  const patchProfile = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/lab/profile", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Ошибка сохранения");
      setJourney(json.data as LabJourney);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const saveProfileForm = () =>
    patchProfile({
      fullName: form.fullName,
      age: form.age ? Number(form.age) : undefined,
      city: form.city,
      telegram: form.telegram,
      educationStatus: form.educationStatus,
      linkedinUrl: form.linkedinUrl,
      interests: form.interests,
    });

  const toggleInterest = (id: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id)
        ? f.interests.filter((i) => i !== id)
        : [...f.interests, id],
    }));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  if (!journey) {
    return <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error || "Не удалось загрузить журнал"}</div>;
  }

  const stepsById = new Map(journey.steps.map((s) => [s.id, s]));
  const nextMeta = LAB_STEPS.find((s) => s.id === journey.nextStepId);
  const cvState = stepsById.get("cv");
  const motivationState = stepsById.get("motivation");
  const proofState = stepsById.get("proof");

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <SectionLabel>Opportunities Lab</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-funding-green" />
          Мой путь участника
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Платформа шаг за шагом ведёт вас от регистрации до первой реальной заявки.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-funding-black">Общий прогресс</p>
          <span className="text-sm font-bold text-funding-green">{journey.progressPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-funding-light-bg overflow-hidden">
          <div
            className="h-full rounded-full bg-funding-green transition-all"
            style={{ width: `${journey.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Next action */}
      {nextMeta && (
        <div className="rounded-2xl border border-funding-green/30 bg-funding-light-green/40 p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-funding-green mb-1">
            Следующее действие
          </p>
          <p className="text-base font-bold text-funding-black">{nextMeta.label}</p>
          <p className="text-sm text-gray-600 mt-1">{nextMeta.description}</p>
          <p className="text-xs text-funding-green mt-1 italic">{nextMeta.hint}</p>
          <Link
            href={nextMeta.href}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "#008A2E" }}
          >
            {nextMeta.action}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <p className="text-sm font-semibold text-funding-black mb-3">Чеклист программы</p>
        <div className="space-y-2">
          {LAB_STEPS.map((meta, index) => {
            const step = stepsById.get(meta.id);
            const state = step?.state ?? "not_started";
            return (
              <div
                key={meta.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  step?.done ? "bg-funding-light-bg border-gray-100 opacity-80" : "bg-white border-gray-200"
                }`}
              >
                <StepIcon state={state} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-funding-black">
                    {index + 1}. {meta.label}
                  </p>
                  <p className="text-xs text-gray-400 italic">{meta.hint}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    state === "needs_revision"
                      ? "bg-amber-50 text-amber-700"
                      : step?.done
                        ? "bg-funding-light-green text-funding-green"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {LAB_STATE_LABELS[state]}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Сохранено возможностей: {journey.savedGrantsCount}/{journey.opportunitiesTarget}
        </p>
      </div>

      {/* Certificate */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className={`w-5 h-5 ${journey.certificate.eligible ? "text-funding-green" : "text-gray-300"}`} />
          <p className="text-sm font-semibold text-funding-black">Прогресс сертификата</p>
          {journey.certificate.eligible && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-funding-light-green text-funding-green">
              Вы готовы к сертификату!
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 italic mb-3">
          Sertifikat alıw ushın barlıq tiykarǵı tapsırmalardı tamamlań.
        </p>
        <ul className="space-y-1.5">
          {journey.certificate.requirements.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              {r.done ? (
                <CheckCircle2 className="w-4 h-4 text-funding-green" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
              <span className={r.done ? "text-gray-500" : "text-funding-black"}>
                {LAB_CERT_REQUIREMENTS[r.id] ?? r.id}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Profile form */}
      <div id="profile" className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <p className="text-sm font-semibold text-funding-black mb-1">Профиль участника</p>
        <p className="text-xs text-gray-400 italic mb-4">Profil maǵlıwmatlarıńızdı tolıqtırıń.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <input placeholder="ФИО *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input placeholder="Возраст" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input placeholder="Город / район *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input placeholder="Telegram (@username) *" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input placeholder="Статус обучения (школа/вуз/выпускник) *" value={form.educationStatus} onChange={(e) => setForm({ ...form, educationStatus: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input placeholder="Ссылка LinkedIn" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
        </div>
        <p className="text-xs text-gray-500 mt-4 mb-2">
          Интересы <span className="italic text-gray-400">(Qızıǵıwshılıqlarıńızdı belgileń)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {LAB_INTERESTS.map((interest) => {
            const active = form.interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-funding-light-green border-funding-green/40 text-funding-green"
                    : "bg-white border-gray-200 text-gray-500 hover:border-funding-green/40"
                }`}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={saveProfileForm}
          disabled={saving}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: "#008A2E" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Сохранить профиль
        </button>
      </div>

      {/* Self-report actions */}
      <div id="actions" className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-4">
        <p className="text-sm font-semibold text-funding-black">Отметки о выполнении</p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3">
          <div>
            <p className="text-sm text-funding-black">CV</p>
            <p className="text-xs text-gray-400">
              Загрузите CV в «Документы» (тип CV) или отметьте статус. Сейчас: {LAB_STATE_LABELS[cvState?.state ?? "not_started"]}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => patchProfile({ cvStatus: "uploaded" })} disabled={saving} className="px-3 py-1.5 rounded-xl border border-funding-green/40 text-xs font-semibold text-funding-green hover:bg-funding-light-green disabled:opacity-50">
              CV готово
            </button>
            <button onClick={() => patchProfile({ cvStatus: "help_requested" })} disabled={saving} className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-funding-green/40 disabled:opacity-50">
              Нужна помощь с CV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3">
          <div>
            <p className="text-sm text-funding-black">Мотивационное письмо</p>
            <p className="text-xs text-gray-400">
              Черновик поможет составить <Link href="/dashboard/ai-writer" className="text-funding-green underline">AI-помощник</Link>. Сейчас: {LAB_STATE_LABELS[motivationState?.state ?? "not_started"]}
            </p>
          </div>
          <button onClick={() => patchProfile({ motivationLetterStatus: "submitted" })} disabled={saving || motivationState?.done} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-funding-green/40 text-xs font-semibold text-funding-green hover:bg-funding-light-green disabled:opacity-50">
            <Send className="w-3.5 h-3.5" />
            Письмо готово
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-funding-black">Подтверждение заявки</p>
            <p className="text-xs text-gray-400">
              Загрузите пруф в <Link href="/dashboard/documents" className="text-funding-green underline">«Документы»</Link> и отметьте подачу. Сейчас: {LAB_STATE_LABELS[proofState?.state ?? "not_started"]}
            </p>
          </div>
          <button onClick={() => patchProfile({ applicationProofStatus: "submitted" })} disabled={saving || proofState?.done} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-funding-green/40 text-xs font-semibold text-funding-green hover:bg-funding-light-green disabled:opacity-50">
            <Send className="w-3.5 h-3.5" />
            Заявка подана
          </button>
        </div>
      </div>
    </div>
  );
}
