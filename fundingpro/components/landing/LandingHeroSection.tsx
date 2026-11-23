"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { trackEvent } from "@/lib/analytics";
import { withLang, type Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

type LandingHeroSectionProps = {
  grantCountLabel: string;
  locale: Locale;
};

export function LandingHeroSection({ grantCountLabel, locale }: LandingHeroSectionProps) {
  const t = getPublicDict(locale);
  const href = (h: string) => withLang(h, locale);
  return (
    <section className="relative min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#020703" }}>
      <nav className="flex items-center justify-between gap-2 px-4 sm:px-6 md:px-12 py-6 border-b border-white/5">
        <FundingProLogo variant="dark" size="md" />
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: "#A7B8AA" }}>
          <Link href={href("/grants")} className="hover:text-white hidden sm:inline">
            {t.nav.grants}
          </Link>
          <Link href={href("/how-it-works")} className="hover:text-white hidden lg:inline">
            {t.nav.how}
          </Link>
          <Link href={href("/pricing")} className="hover:text-white hidden sm:inline">
            {t.nav.prices}
          </Link>
          <Link href={href("/business")} className="hover:text-white hidden md:inline">
            {t.nav.business}
          </Link>
          <LanguageSwitcher locale={locale} path="/" tone="dark" />
          <Link
            href="/auth"
            onClick={() => trackEvent("landing_cta_click", { placement: "nav" })}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-funding-green text-white text-sm font-semibold hover:bg-funding-accent transition-colors"
          >
            {t.nav.login} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-20 text-center relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[400px] rounded-full blur-3xl"
            style={{ background: "rgba(0,138,46,0.06)" }}
          />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <div
            className="inline-block max-w-full px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 tracking-wide"
            style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse align-middle mr-2" style={{ background: "#12B94F" }} />
            {t.hero.badge}
          </div>

          <h1 className="text-[1.9rem] leading-[1.05] sm:text-6xl md:text-7xl font-black tracking-tight sm:leading-[1.0] mb-6 break-words">
            {t.hero.h1a} <span className="whitespace-nowrap" style={{ color: "#12B94F" }}>{t.hero.h1b}</span> {t.hero.h1c}
          </h1>

          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#A7B8AA" }}>
            {t.hero.lead}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href={href("/grants")}
              onClick={() => trackEvent("landing_cta_click", { placement: "hero_catalog" })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "#008A2E", color: "#fff" }}
            >
              {t.hero.ctaCatalog} <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={href("/business")}
              onClick={() => trackEvent("landing_cta_click", { placement: "hero_business" })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              {t.hero.ctaBusiness}
            </Link>
          </div>
          <Link
            href="/dashboard/lab/start"
            onClick={() => trackEvent("lab_cta_click", { placement: "hero" })}
            className="inline-block mt-4 text-sm font-semibold hover:underline"
            style={{ color: "#12B94F" }}
          >
            {t.hero.ctaLab}
          </Link>

          <p className="text-xs mt-8 max-w-lg mx-auto" style={{ color: "rgba(167,184,170,0.6)" }}>
            {t.hero.disclaimer}
          </p>
        </div>
      </div>

      <div className="border-t px-6 md:px-12 py-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-6 md:gap-16">
          {t.hero.stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="text-xl sm:text-2xl font-black" style={{ color: "#12B94F" }}>
                {i === 0 ? grantCountLabel : s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#A7B8AA" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
