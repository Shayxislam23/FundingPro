"use client";

import Link from "next/link";
import { LegalFooter } from "@/components/design/LegalFooter";
import { LeadMagnetForm } from "@/components/landing/LeadMagnetForm";
import { trackEvent } from "@/lib/analytics";
import { withLang, type Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

export function LandingCtaSection({ locale }: { locale: Locale }) {
  const t = getPublicDict(locale).cta;
  return (
    <section
      className="py-20 px-6 md:px-12 border-t"
      style={{ background: "#020703", borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">{t.title}</h2>
        <p className="mb-6 max-w-xl mx-auto" style={{ color: "#A7B8AA" }}>
          {t.text}
        </p>
        <LeadMagnetForm locale={locale} />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href={withLang("/grants", locale)}
            onClick={() => trackEvent("landing_cta_click", { placement: "footer" })}
            className="inline-block px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "#008A2E", color: "#fff" }}
          >
            {t.catalog}
          </Link>
          <Link
            href={withLang("/business", locale)}
            onClick={() => trackEvent("landing_cta_click", { placement: "footer_business" })}
            className="inline-block px-6 py-3.5 rounded-xl font-semibold text-sm border"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            {t.business}
          </Link>
        </div>
        <LegalFooter locale={locale} className="mt-8" variant="dark" style={{ color: "rgba(167,184,170,0.4)" }} />
      </div>
    </section>
  );
}
