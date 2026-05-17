"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { PricingCard } from "@/components/design/PricingCard";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Оплата</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Подписка</h1>
      </div>

      {/* Current plan */}
      <div
        className="rounded-2xl p-6 mb-8 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #008A2E 0%, #006B22 100%)", color: "#fff" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-200 mb-1">Текущий план</p>
          <h2 className="text-xl font-black mb-1">НКО Pro</h2>
          <p className="text-sm text-green-100">$50/мес · Активна до 01.06.2025</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
          Активна
        </div>
      </div>

      {/* NGO plans */}
      <div className="mb-8">
        <h2 className="font-bold text-funding-black mb-4">НКО и частные лица</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <PricingCard
            name="Basic"
            price="$30"
            features={["Доступ к базе грантов", "5 AI-проверок", "2 черновика", "Базовый трекер"]}
            cta="Выбрать"
          />
          <PricingCard
            name="Pro"
            price="$50"
            features={["Всё из Basic", "Безлимитные проверки", "10 AI-предложений", "Документы", "Консультация 1ч"]}
            cta="Текущий план"
            highlighted
          />
          <PricingCard
            name="Consulting"
            price="$100"
            features={["Всё из Pro", "Персональный консультант", "Pre-application review", "Поддержка отчётности"]}
            cta="Выбрать"
          />
        </div>
      </div>

      {/* Business plans */}
      <div className="mb-8">
        <h2 className="font-bold text-funding-black mb-4">Бизнес</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <PricingCard
            name="Starter"
            price="$90"
            features={["Корпоративный профиль", "До 5 пользователей", "Безлимитные гранты", "Полный AI-пакет"]}
            cta="Выбрать"
          />
          <PricingCard
            name="Pro"
            price="$200"
            features={["Всё из Starter", "До 20 пользователей", "API-доступ", "Персональный менеджер"]}
            cta="Выбрать"
          />
          <PricingCard
            name="Enterprise"
            price="$500+"
            features={["Индивидуальные условия", "Безлимитные пользователи", "Dedicated AI", "SLA поддержка"]}
            cta="Связаться"
          />
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-funding-light-bg rounded-2xl border border-gray-100 p-6">
        <div className="flex gap-3 mb-3">
          <ShieldCheck className="w-5 h-5 text-funding-green flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-funding-black mb-1">Безопасная оплата через ZOOMRAD</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Платёж обрабатывается через платёжную инфраструктуру ZOOMRAD. FundingPro не хранит данные карт
              и не является платёжной организацией. Подписка активируется автоматически после подтверждения
              платежа ZOOMRAD.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Гонорар за успех: 2–5% от суммы полученного гранта только при наличии предварительного договора.
          Частичный возврат 30% возможен при отсутствии гранта в оговорённых условиях.
        </p>
      </div>
    </div>
  );
}
