"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Loader2, Mail } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

export function LeadMagnetForm({ locale = "ru" }: { locale?: Locale }) {
  const t = getPublicDict(locale).cta;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing_pdf" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(locale === "ru" ? (data.error?.message ?? t.error) : t.error);
      trackEvent("lead_magnet_submit");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-funding-green font-medium">
        {t.emailDone}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: "#008A2E" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.emailButton}
      </button>
      {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
    </form>
  );
}
