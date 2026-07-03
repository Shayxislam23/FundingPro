"use client";

import Link from "next/link";
import { LegalFooter } from "@/components/design/LegalFooter";
import { LeadMagnetForm } from "@/components/landing/LeadMagnetForm";
import { trackEvent } from "@/lib/analytics";

export function LandingCtaSection() {
  return (
    <section
      className="py-20 px-6 md:px-12 border-t"
      style={{ background: "#020703", borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Готовы начать?</h2>
        <p className="mb-6 max-w-xl mx-auto" style={{ color: "#A7B8AA" }}>
          Получите подборку грантов, стипендий и конкурсов для бизнеса и молодёжи Узбекистана на email или начните
          бесплатно в дашборде.
        </p>
        <LeadMagnetForm />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/auth"
            onClick={() => trackEvent("landing_cta_click", { placement: "footer" })}
            className="inline-block px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "#008A2E", color: "#fff" }}
          >
            Начать бесплатно
          </Link>
        </div>
        <LegalFooter className="mt-8" variant="dark" style={{ color: "rgba(167,184,170,0.4)" }} />
      </div>
    </section>
  );
}
