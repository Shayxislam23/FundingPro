"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ShieldCheck, Clock, CheckCircle2, ChevronRight } from "lucide-react";

const ngoPlans = [
  {
    id: "plan-ngo-basic",
    name: "Basic",
    nameRu: "НКО / Физлица Basic",
    price: "$30",
    period: "/мес",
    features: ["Доступ к базе 1 000+ грантов", "5 AI-проверок соответствия", "2 черновика заявок", "Базовый трекер статусов"],
  },
  {
    id: "plan-ngo-pro",
    name: "Pro",
    nameRu: "НКО / Физлица Pro",
    price: "$50",
    period: "/мес",
    highlighted: true,
    features: ["Всё из Basic", "Безлимитные AI-проверки", "10 черновиков заявок", "Хранилище документов", "Консультация 1 час"],
  },
  {
    id: "plan-consulting",
    name: "Consulting",
    nameRu: "Консалтинг",
    price: "$100",
    period: "/мес",
    features: ["Всё из Pro", "Персональный консультант", "Pre-application review", "3 часа консультаций", "Поддержка отчётности"],
  },
];

const businessPlans = [
  {
    id: "plan-business-starter",
    name: "Starter",
    nameRu: "Бизнес Starter",
    price: "$90",
    period: "/мес",
    features: ["Корпоративный профиль", "До 3 пользователей", "Безлимитные гранты", "Полный AI-пакет", "2 часа консультаций"],
  },
  {
    id: "plan-business-pro",
    name: "Pro",
    nameRu: "Бизнес Pro",
    price: "$200",
    period: "/мес",
    highlighted: true,
    features: ["Всё из Starter", "До 10 пользователей", "5 часов консультаций", "AI без лимитов", "Приоритетная поддержка"],
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    nameRu: "Enterprise",
    price: "$500+",
    period: "/мес",
    features: ["Индивидуальные условия", "Безлимитные пользователи", "Безлимитные консультации", "Выделенный менеджер", "SLA поддержка"],
  },
];

export default function SubscriptionPage() {
  const [requested, setRequested] = useState<string | null>(null);

  function handleRequest(planId: string, planName: string) {
    // TODO: POST /api/v1/support-tickets with plan request
    setRequested(planId);
    // In production: send request to team and notify via email
  }

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Подписка</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Тарифы</h1>
      </div>

      {/* Payment pending notice */}
      <div
        className="flex items-start gap-3 rounded-2xl p-5 mb-8 border"
        style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}
      >
        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#EA580C" }} />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#9A3412" }}>
            Онлайн-оплата временно недоступна
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#C2410C" }}>
            Вы можете отправить запрос на подключение тарифа, и команда FundingPro свяжется с вами в течение 24 часов.
          </p>
        </div>
      </div>

      {/* NGO plans */}
      <div className="mb-8">
        <h2 className="font-bold text-funding-black mb-4">НКО и частные лица</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {ngoPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              requested={requested === plan.id}
              onRequest={() => handleRequest(plan.id, plan.nameRu)}
            />
          ))}
        </div>
      </div>

      {/* Business plans */}
      <div className="mb-8">
        <h2 className="font-bold text-funding-black mb-4">Бизнес</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {businessPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              requested={requested === plan.id}
              onRequest={() => handleRequest(plan.id, plan.nameRu)}
            />
          ))}
        </div>
      </div>

      {/* Success fee */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h3 className="font-bold text-sm text-funding-black mb-3">Гонорар за успех</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          2–5% от суммы полученного гранта — только при наличии предварительного письменного договора.
          Частичный возврат 30% возможен при отсутствии результата в оговорённых условиях.
        </p>
        <p className="text-xs text-gray-400">
          FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить заявку.
        </p>
      </div>

      {/* Security note */}
      <div
        className="flex items-start gap-3 rounded-2xl p-5 border"
        style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
      >
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#14532D" }}>
            Безопасность платежей
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#166534" }}>
            FundingPro не хранит данные карт и не является платёжной, кредитной или микрофинансовой организацией.
            Подписка активируется после подтверждения оплаты командой FundingPro.
          </p>
        </div>
      </div>
    </div>
  );
}

type Plan = {
  id: string;
  name: string;
  nameRu: string;
  price: string;
  period: string;
  highlighted?: boolean;
  features: string[];
};

function PlanCard({ plan, requested, onRequest }: { plan: Plan; requested: boolean; onRequest: () => void }) {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col"
      style={
        plan.highlighted
          ? { background: "#020703", borderColor: "rgba(0,138,46,0.5)", color: "#fff" }
          : { background: "#fff", borderColor: "#e5e7eb", color: "#050505" }
      }
    >
      {plan.highlighted && (
        <div
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 self-start"
          style={{ background: "rgba(0,138,46,0.2)", color: "#12B94F" }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
          Популярный
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: plan.highlighted ? "#A7B8AA" : "#6b7280" }}>
        {plan.nameRu}
      </p>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-black">{plan.price}</span>
        <span className="text-sm" style={{ color: plan.highlighted ? "#A7B8AA" : "#9ca3af" }}>{plan.period}</span>
      </div>
      <ul className="space-y-2 flex-1 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
            <span style={{ color: plan.highlighted ? "#D1FAE5" : "#4A5A4D" }}>{f}</span>
          </li>
        ))}
      </ul>

      {requested ? (
        <div
          className="w-full py-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2"
          style={{ background: "rgba(0,138,46,0.15)", color: "#12B94F" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Запрос отправлен
        </div>
      ) : (
        <button
          onClick={onRequest}
          className="w-full py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={
            plan.highlighted
              ? { background: "#008A2E", color: "#fff" }
              : { background: "#F0FDF4", color: "#008A2E", border: "1px solid #BBF7D0" }
          }
        >
          Запросить подключение
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
