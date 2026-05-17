"use client";

import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { ZoomradBadge } from "@/components/design/ZoomradBadge";
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
  return (
    <div className="min-h-screen bg-funding-dark text-white overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col" style={{ background: "#020703" }}>
        {/* Top nav */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
          <FundingProLogo variant="dark" size="md" />
          <div className="flex items-center gap-4">
            <ZoomradBadge variant="outline" />
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-funding-green text-white text-sm font-semibold hover:bg-funding-accent transition-colors"
            >
              Войти <ArrowRight className="w-3 h-3" />
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
              FundingPro Mini App — ZOOMRAD
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Найдите гранты.{" "}
              <span style={{ color: "#12B94F" }}>Подайте заявку.</span>
              <br />
              Получите финансирование.
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#A7B8AA" }}>
              AI-платформа для поиска международных грантов, проверки соответствия требованиям
              и подготовки профессиональных предложений на русском и узбекском языках.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/zoomrad/welcome"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: "#008A2E", color: "#fff" }}
              >
                Открыть в ZOOMRAD <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl border font-semibold text-sm hover:border-funding-green hover:text-funding-accent transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                Веб-дашборд
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
              { value: "1,000+", label: "грантов в базе" },
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
              value="1,000+"
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
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel className="text-funding-green">Тарифы</SectionLabel>
            <h2 className="text-4xl font-black mb-3" style={{ color: "#050505" }}>
              Выберите план
            </h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: "#6b7280" }}>
              Для НКО, частных лиц и бизнеса. Оплата через ZOOMRAD.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PricingCard
              name="НКО / Физлица Basic"
              price="$30"
              features={[
                "Доступ к базе грантов",
                "5 AI-проверок соответствия",
                "2 черновика предложений",
                "Базовый трекер заявок",
              ]}
              cta="Начать"
            />
            <PricingCard
              name="НКО / Физлица Pro"
              price="$50"
              features={[
                "Всё из Basic",
                "Безлимитные проверки",
                "10 AI-предложений",
                "Хранилище документов",
                "Консультация 1 час",
              ]}
              cta="Выбрать Pro"
              highlighted
            />
            <PricingCard
              name="Бизнес Starter"
              price="$90"
              features={[
                "Корпоративный профиль",
                "Мультипользовательский доступ",
                "Безлимитные гранты",
                "Полный AI-пакет",
                "Приоритетная поддержка",
              ]}
              cta="Для бизнеса"
            />
          </div>
          <p className="text-center text-xs mt-8" style={{ color: "#9ca3af" }}>
            Также: Consulting $100/мес, Business Pro $200/мес, Enterprise $500+/мес.
            Гонорар за успех: 2–5% от суммы полученного гранта при наличии договора.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6 md:px-12 border-t"
        style={{ background: "#020703", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <ZoomradBadge variant="outline" className="mb-6 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Готовы начать?
          </h2>
          <p className="mb-10 max-w-xl mx-auto" style={{ color: "#A7B8AA" }}>
            Откройте FundingPro прямо в приложении ZOOMRAD или используйте полный веб-дашборд.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/zoomrad/welcome"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "#008A2E", color: "#fff" }}
            >
              Открыть Mini App
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl border font-semibold text-sm transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              Войти в дашборд
            </Link>
          </div>
          <p className="text-xs mt-8" style={{ color: "rgba(167,184,170,0.4)" }}>
            Beta Version Solutions ООО, DGU No. 61712
          </p>
        </div>
      </section>
    </div>
  );
}
