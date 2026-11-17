"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getStoredUtm, trackEvent } from "@/lib/analytics";
import { SERVICE_APPLICANT_TYPES, UZ_REGIONS } from "@/lib/service-requests";

type Status = "idle" | "sending" | "done" | "error";

const field = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-funding-green";

export function BusinessRequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const utm = getStoredUtm();
    const body = {
      full_name: String(fd.get("full_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      organization_name: String(fd.get("organization_name") ?? "") || undefined,
      applicant_type: String(fd.get("applicant_type") ?? "business"),
      region: String(fd.get("region") ?? ""),
      grant_interest: String(fd.get("grant_interest") ?? "") || undefined,
      message: String(fd.get("message") ?? "") || undefined,
      preferred_language: String(fd.get("preferred_language") ?? "ru"),
      consent: fd.get("consent") === "on",
      website: String(fd.get("website") ?? "") || undefined,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
    };
    if (!body.consent) {
      setError("Отметьте согласие на обработку данных.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/v1/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message ?? "Не удалось отправить заявку");
      trackEvent("service_request_submitted", { applicant_type: body.applicant_type });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-funding-green mx-auto mb-3" />
        <h2 className="text-xl font-black mb-2">Заявка отправлена</h2>
        <p className="text-sm text-gray-500">Мы свяжемся с вами в течение рабочего дня и бесплатно оценим ваши шансы.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-semibold">Имя *</span>
          <input name="full_name" required maxLength={120} autoComplete="name" className={`${field} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Телефон *</span>
          <input name="phone" type="tel" inputMode="tel" maxLength={32} autoComplete="tel" placeholder="+998 90 123 45 67" className={`${field} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Email</span>
          <input name="email" type="email" maxLength={254} autoComplete="email" className={`${field} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Организация</span>
          <input name="organization_name" maxLength={200} autoComplete="organization" className={`${field} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Кто вы *</span>
          <select name="applicant_type" defaultValue="business" className={`${field} mt-1 bg-white`}>
            {Object.entries(SERVICE_APPLICANT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Регион</span>
          <select name="region" defaultValue="" className={`${field} mt-1 bg-white`}>
            <option value="">—</option>
            {UZ_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-semibold">Какой грант или на что нужно финансирование</span>
        <input name="grant_interest" maxLength={300} placeholder="Например: капельное орошение, 50 000 $" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">Коротко о проекте</span>
        <textarea name="message" maxLength={2000} rows={4} className={`${field} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">Язык общения</span>
        <select name="preferred_language" defaultValue="ru" className={`${field} mt-1 bg-white`}>
          <option value="ru">Русский</option>
          <option value="uz">O‘zbekcha</option>
        </select>
      </label>
      {/* Honeypot — hidden from people, bots fill it. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input name="consent" type="checkbox" className="mt-0.5" />
        <span>
          Я согласен(на), чтобы FundingPro связался со мной по телефону или e-mail для помощи с грантовой заявкой и
          обрабатывал для этого мои данные.
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-funding-green text-white font-semibold text-sm disabled:opacity-60"
      >
        {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
        Получить бесплатную оценку
      </button>
    </form>
  );
}
