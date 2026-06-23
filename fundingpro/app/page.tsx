"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { MetricCard } from "@/components/design/MetricCard";
import { PricingCard } from "@/components/design/PricingCard";
import {
  Search,
  CheckCircle2,
  FileText,
  BarChart3,
  FolderOpen,
  Users,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import { formatPlanPriceDisplay } from "@/lib/format-plan";
import { trackEvent, captureUtmParams } from "@/lib/analytics";
import { LeadMagnetForm } from "@/components/landing/LeadMagnetForm";

type LandingPlan = {
  id: string;
  nameRu: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
};

const FEATURED_PLAN_IDS = ["plan-ngo-basic", "plan-ngo-pro", "plan-business-starter"];

const features = [
  {
    icon: Search,
    title: "Поиск грантов",
    desc: "База 1 000+ международных грантов с фильтрами по сектору, сумме, дедлайну и стране.",
  },
  {
    icon: CheckCircle2,
    title: "Проверка соответствия",
    desc: "AI проверит соответствие требованиям донора и укажет на пробелы в документах.",
  },
  {
    icon: FileText,
    title: "AI-предложение",
    desc: "Подготовьте черновик заявки в структуре UNDP, EU, GIZ или World Bank за минуты.",
  },
  {
    icon: BarChart3,
    title: "Трекер заявок",
    desc: "Отслеживайте статус каждой заявки — от черновика до получения гранта.",
  },
  {
    icon: FolderOpen,
    title: "Документы",
    desc: "Безопасное хранение учредительных документов, CV и писем поддержки.",
  },
  {
    icon: Users,
    title: "Консультанты",
    desc: "Проверенные эксперты по грантовому письму, бюджетированию и отчётности.",
  },
];

export default function LandingPage() {
  const [grantTotal, setGrantTotal] = useState<number | null>(null);
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [usdUzsRate, setUsdUzsRate] = useState<number | null>(null);

  useEffect(() => {
    captureUtmParams();
  }, []);

  useEffect(() => {
    fetch("/api/v1/grants?limit=1")
      .then((r) => r.json())
      .then((d) => setGrantTotal(d.data?.total ?? null))
      .catch(() => setGrantTotal(null));
  }, []);

  useEffect(() => {
    fetch("/api/v1/plans")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.data?.plans ?? []) as LandingPlan[];
        const featured = FEATURED_PLAN_IDS.map((id) => all.find((p) => p.id === id)).filter(
          (p): p is LandingPlan => Boolean(p)
        );
        setPlans(featured.length > 0 ? featured : all.slice(0, 3));
        if (d.data?.usdUzsRate) setUsdUzsRate(Number(d.data.usdUzsRate));
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const grantCountLabel =
    grantTotal !== null && grantTotal > 0
      ? grantTotal >= 1000
        ? `${Math.floor(grantTotal / 100) * 100}+`
        : String(grantTotal)
      : "1,000+";

  return (
    <div className="min-h-screen bg-funding-dark text-white overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col" style={{ background: "#020703" }}>
        {/* Top nav */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
          <FundingProLogo variant="dark" size="md" />
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: "#A7B8AA" }}>
            <Link href="/grants" className="hover:text-white hidden sm:inline">Гранты</Link>
            <Link href="/how-it-works" className="hover:text-white hidden sm:inline">Как работает</Link>
            <a href="#pricing" className="hover:text-white hidden sm:inline">Тарифы</a>
            <Link
              href="/auth"
              onClick={() => trackEvent("landing_cta_click", { placement: "nav" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-funding-green text-white text-sm font-semibold hover:bg-funding-accent transition-colors"
            >
              Начать бесплатно <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </nav>

        {/* Hero content */}
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
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#12B94F" }}
              />
              AI-платформа для грантов · бесплатный старт
            </div>

            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "rgba(0,138,46,0.15)", color: "#86efac" }}
            >
              Бесплатно: 2 проверки соответствия + 1 AI-черновик в месяц
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Найдите гранты.{" "}
              <span style={{ color: "#12B94F" }}>Подайте заявку.</span>
              <br />
              Получите финансирование.
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#A7B8AA" }}>
              AI-платформа для поиска международных грантов, проверки соответствия требованиям
              и подготовки профессиональных предложений. Юридические документы — на русском и узбекском.
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
              FundingPro не гарантирует получение гранта. Платформа помогает найти возможности,
              проверить требования и подготовить заявку.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="border-t px-6 md:px-12 py-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: grantCountLabel, label: "грантов в базе" },
              { value: "Top 10", label: "AI-подбор по профилю" },
              { value: "UNDP/EU/GIZ", label: "форматы заявок" },
              { value: "24/7", label: "AI-поддержка" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black" style={{ color: "#12B94F" }}>{value}</div>
                <div className="text-xs mt-1" style={{ color: "#A7B8AA" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-6 md:px-12 border-t border-white/5" style={{ background: "#020703" }}>
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel className="text-funding-muted">Как это работает</SectionLabel>
          <h2 className="text-3xl font-black mb-10">Первый грант за 30 минут</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { step: "1", title: "Профиль НКО", desc: "Укажите сектор и миссию — AI подберёт релевантные гранты." },
              { step: "2", title: "Проверка соответствия", desc: "Узнайте, насколько ваша организация подходит требованиям донора." },
              { step: "3", title: "AI-черновик", desc: "Получите структурированную заявку в формате UNDP, EU или GIZ." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-white/10 p-5">
                <span className="text-2xl font-black text-funding-green">{step}</span>
                <h3 className="font-bold mt-2 mb-1">{title}</h3>
                <p className="text-sm" style={{ color: "#A7B8AA" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 px-6 border-t border-white/5" style={{ background: "#020703" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#A7B8AA" }}>Для НКО Узбекистана</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold" style={{ color: "rgba(167,184,170,0.7)" }}>
            <span>UNDP · EU · GIZ</span>
            <span>·</span>
            <span>{grantCountLabel} грантов</span>
            <span>·</span>
            <span>Оплата в UZS через Uzum</span>
          </div>
        </div>
      </section>

      {/* WHAT IS FUNDINGPRO */}
      <section className="bg-white py-20 px-6 md:px-12" style={{ color: "#050505" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel>О платформе</SectionLabel>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8">
                Что такое{" "}
                <span style={{ color: "#008A2E" }}>FundingPro</span>?
              </h2>
              <ul className="space-y-4">
                {[
                  "Поиск подходящих грантов по профилю организации",
                  "AI-проверка соответствия требованиям донора",
                  "Генерация черновика заявки в структуре донора",
                  "CRM-трекер статусов заявок",
                  "Безопасное хранение документов",
                  "Маркетплейс проверенных консультантов",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#D9F7DD" }}
                    >
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#008A2E" }} />
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: "#4A5A4D" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <MetricCard
              value={grantCountLabel}
              label="международных грантов в базе данных"
              subvalue="Top 10"
              sublabel="AI-подобранных грантов по профилю пользователя"
              variant="light"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 md:px-12" style={{ background: "#F7FAF7" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel className="text-funding-green">Возможности</SectionLabel>
            <h2 className="text-4xl font-black" style={{ color: "#050505" }}>
              Полный цикл работы с грантами
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border hover:shadow-md transition-all duration-200"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#D9F7DD" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#008A2E" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#050505" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel className="text-funding-green">Тарифы</SectionLabel>
            <h2 className="text-4xl font-black mb-3" style={{ color: "#050505" }}>
              Выберите план
            </h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: "#6b7280" }}>
              Для НКО, частных лиц и бизнеса.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plansLoading && (
              <p className="col-span-full text-center text-sm text-gray-400">Загрузка тарифов…</p>
            )}
            {!plansLoading &&
              plans.map((plan) => {
                const display = formatPlanPriceDisplay(plan.priceUzs, plan.priceUsd);
                return (
                <PricingCard
                  key={plan.id}
                  name={plan.nameRu}
                  price={display.primary}
                  priceSecondary={display.secondary}
                  features={plan.features.slice(0, 6)}
                  cta={plan.highlighted ? "Выбрать план" : "Начать"}
                  highlighted={plan.highlighted}
                  href="/auth"
                />
              );})}
            {!plansLoading && plans.length === 0 && (
              <p className="col-span-full text-center text-sm text-gray-500">
                Тарифы временно недоступны.{" "}
                <Link href="/auth" className="text-funding-green hover:underline">
                  Войти в дашборд
                </Link>
              </p>
            )}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: "#9ca3af" }}>
            Цены в сумах (UZS){usdUzsRate ? `, курс 1 USD = ${usdUzsRate.toLocaleString("ru-RU")} UZS` : ""}. USD — справочно.
            {" "}Гонорар за успех: 2–5% — см.{" "}
            <Link href="/legal/success-fee" className="text-funding-green underline">
              условия
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6 md:px-12 border-t"
        style={{ background: "#020703", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Готовы начать?
          </h2>
          <p className="mb-6 max-w-xl mx-auto" style={{ color: "#A7B8AA" }}>
            Получите подборку грантов для НКО Узбекистана на email или начните бесплатно в дашборде.
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
    </div>
  );
}
