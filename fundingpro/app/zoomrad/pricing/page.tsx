"use client";

import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { Check } from "lucide-react";

const plans = [
  {
    id: "ngo-basic",
    name: "НКО Basic",
    price: "$30",
    period: "/мес",
    features: [
      "Доступ к базе грантов",
      "5 AI-проверок соответствия",
      "2 черновика предложений",
      "Базовый трекер заявок",
    ],
    highlighted: false,
  },
  {
    id: "ngo-pro",
    name: "НКО Pro",
    price: "$50",
    period: "/мес",
    features: [
      "Всё из Basic",
      "Безлимитные проверки",
      "10 AI-предложений",
      "Хранилище документов",
      "Консультация 1 час",
    ],
    highlighted: true,
    badge: "Популярный",
  },
  {
    id: "consulting",
    name: "Consulting",
    price: "$100",
    period: "/мес",
    features: [
      "Всё из Pro",
      "Персональный консультант",
      "Pre-application review",
      "Поддержка по отчётности",
    ],
    highlighted: false,
  },
  {
    id: "business-starter",
    name: "Бизнес Starter",
    price: "$90",
    period: "/мес",
    features: [
      "Корпоративный профиль",
      "До 5 пользователей",
      "Безлимитные гранты",
      "Полный AI-пакет",
    ],
    highlighted: false,
    tag: "Бизнес",
  },
];

export default function PricingPage() {
  return (
    <ZoomradShell variant="light" title="Тарифы" showBack>
      <div className="px-4 pt-5 pb-10">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#008A2E" }}>
            Тарифные планы
          </p>
          <h1 className="text-2xl font-black text-funding-black mb-2">Выберите план</h1>
          <p className="text-sm" style={{ color: "#4A5A4D" }}>Оплата через ZOOMRAD. Без скрытых платежей.</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl p-5 relative"
              style={
                plan.highlighted
                  ? { background: "#008A2E" }
                  : { background: "#fff", border: "1px solid #e5e7eb" }
              }
            >
              {plan.badge && (
                <div
                  className="absolute -top-2.5 left-5 px-3 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#12B94F", color: "#fff" }}
                >
                  {plan.badge}
                </div>
              )}
              {plan.tag && (
                <div
                  className="absolute -top-2.5 left-5 px-3 py-0.5 rounded-full text-xs font-bold border"
                  style={{ background: "#fff", borderColor: "#008A2E", color: "#008A2E" }}
                >
                  {plan.tag}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: plan.highlighted ? "rgba(255,255,255,0.7)" : "#008A2E" }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className="text-3xl font-black"
                      style={{ color: plan.highlighted ? "#fff" : "#050505" }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-sm mb-1"
                      style={{ color: plan.highlighted ? "rgba(255,255,255,0.6)" : "#9ca3af" }}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: plan.highlighted ? "rgba(255,255,255,0.2)" : "#D9F7DD",
                      }}
                    >
                      <Check
                        className="w-2.5 h-2.5"
                        style={{ color: plan.highlighted ? "#fff" : "#008A2E" }}
                      />
                    </span>
                    <span style={{ color: plan.highlighted ? "rgba(255,255,255,0.85)" : "#4A5A4D" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/zoomrad/payment?plan=${plan.id}`}
                className="block w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors"
                style={
                  plan.highlighted
                    ? { background: "#fff", color: "#008A2E" }
                    : { background: "#008A2E", color: "#fff" }
                }
              >
                Выбрать
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div
          className="mt-4 p-5 rounded-2xl border text-center"
          style={{ borderColor: "#e5e7eb", background: "#F7FAF7" }}
        >
          <p className="text-sm font-semibold text-funding-black mb-1">Enterprise $500+/мес</p>
          <p className="text-xs mb-3" style={{ color: "#4A5A4D" }}>
            Индивидуальное решение для крупных организаций
          </p>
          <Link
            href="/zoomrad/support"
            className="text-xs font-semibold"
            style={{ color: "#008A2E" }}
          >
            Связаться с командой →
          </Link>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: "#9ca3af" }}>
          Гонорар за успех: 2–5% от суммы полученного гранта только при наличии договора.
          30% возврат при отсутствии гранта в оговорённых условиях.
        </p>
      </div>
    </ZoomradShell>
  );
}
