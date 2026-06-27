"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { trackEvent } from "@/lib/analytics";

type LandingHeroSectionProps = {
  grantCountLabel: string;
};

export function LandingHeroSection({ grantCountLabel }: LandingHeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: "#020703" }}>
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
        <FundingProLogo variant="dark" size="md" />
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: "#A7B8AA" }}>
          <Link href="/grants" className="hover:text-white hidden sm:inline">
            Гранты
          </Link>
          <Link href="/how-it-works" className="hover:text-white hidden sm:inline">
            Как работает
          </Link>
          <Link href="/pricing" className="hover:text-white hidden sm:inline">
            Тарифы
          </Link>
          <Link
            href="/auth"
            onClick={() => trackEvent("landing_cta_click", { placement: "nav" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-funding-green text-white text-sm font-semibold hover:bg-funding-accent transition-colors"
          >
            Начать бесплатно <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-20 text-center relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
            style={{ background: "rgba(0,138,46,0.06)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 tracking-wide"
            style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#12B94F" }} />
            AI-платформа для грантов · бесплатный старт
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: "rgba(0,138,46,0.15)", color: "#86efac" }}
          >
            Бесплатно: 2 проверки соответствия + 1 AI-черновик в месяц
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6">
            Найдите гранты. <span style={{ color: "#12B94F" }}>Подайте заявку.</span>
            <br />
            Получите финансирование.
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#A7B8AA" }}>
            AI-платформа для поиска международных грантов, проверки соответствия требованиям и подготовки
            профессиональных предложений. Юридические документы — на русском и узбекском.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth"
              onClick={() => trackEvent("landing_cta_click", { placement: "hero" })}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "#008A2E", color: "#fff" }}
            >
              Начать бесплатно <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/grants"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#A7B8AA" }}
            >
              Смотреть гранты
            </Link>
          </div>

          <p className="text-xs mt-8 max-w-lg mx-auto" style={{ color: "rgba(167,184,170,0.6)" }}>
            FundingPro не гарантирует получение гранта. Платформа помогает найти возможности, проверить
            требования и подготовить заявку.
          </p>
        </div>
      </div>

      <div className="border-t px-6 md:px-12 py-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: grantCountLabel, label: "грантов в базе" },
            { value: "Top 10", label: "AI-подбор по профилю" },
            { value: "UNDP/EU/GIZ", label: "форматы заявок" },
            { value: "24/7", label: "AI-поддержка" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black" style={{ color: "#12B94F" }}>
                {value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#A7B8AA" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
