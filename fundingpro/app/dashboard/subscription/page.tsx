"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ShieldCheck, Clock, CheckCircle2, ChevronRight, Loader2, CreditCard, Smartphone } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { formatPlanPrice, formatPlanPriceDisplay } from "@/lib/format-plan";

type Plan = {
  id: string;
  name: string;
  nameRu: string;
  pricePrimary: string;
  priceSecondary: string;
  period: string;
  highlighted?: boolean;
  features: string[];
};

type PaymentConfig = {
  paymentsEnabled: boolean;
  integrationStatus: string;
  message: string;
  merchantConfigured: boolean;
  checkoutConfigured: boolean;
};

function mapApiPlan(row: {
  id: string;
  name: string;
  nameRu: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
}): Plan {
  const display = formatPlanPriceDisplay(row.priceUzs, row.priceUsd);
  return {
    id: row.id,
    name: row.name,
    nameRu: row.nameRu,
    pricePrimary: display.primary,
    priceSecondary: display.secondary,
    period: "/мес",
    highlighted: row.highlighted,
    features: row.features,
  };
}

export default function SubscriptionPage() {
  const [requested, setRequested] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [ngoPlans, setNgoPlans] = useState<Plan[]>([]);
  const [businessPlans, setBusinessPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [usdUzsRate, setUsdUzsRate] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [acceptPaymentLegal, setAcceptPaymentLegal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{
    planName: string;
    limits: { eligibilityChecks: number | null; aiProposals: number | null };
    used: { eligibilityChecks: number; aiProposals: number };
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const [subRes, usageRes] = await Promise.all([
          fetch("/api/v1/subscriptions/current", { headers }),
          fetch("/api/v1/plan-usage", { headers }),
        ]);
        if (usageRes.ok) {
          const u = await usageRes.json();
          setCurrentPlan(u.data);
        } else if (subRes.ok) {
          const s = await subRes.json();
          const plan = s.data?.plan;
          if (plan) {
            setCurrentPlan({
              planName: plan.nameRu ?? plan.name,
              limits: { eligibilityChecks: null, aiProposals: null },
              used: { eligibilityChecks: 0, aiProposals: 0 },
            });
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/plans").then((r) => r.json()),
      fetch("/api/v1/payments/status").then((r) => r.json()),
    ])
      .then(([plansRes, payRes]) => {
        const grouped = plansRes.data?.grouped;
        if (grouped?.ngo?.length) setNgoPlans(grouped.ngo.map(mapApiPlan));
        if (grouped?.business?.length) setBusinessPlans(grouped.business.map(mapApiPlan));
        if (payRes.data) setPaymentConfig(payRes.data);
        if (plansRes.data?.usdUzsRate) setUsdUzsRate(plansRes.data.usdUzsRate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRequest(planId: string, planName: string) {
    setRequesting(planId);
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/v1/subscription-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId, planName }),
      });
      setRequested(planId);
    } finally {
      setRequesting(null);
    }
  }

  async function handlePay(planId: string, method: "checkout" | "uzum_app") {
    if (!acceptPaymentLegal) {
      setPayError("Примите оферту и политику возвратов перед оплатой");
      return;
    }
    setPayError(null);
    setPaying(`${planId}:${method}`);
    try {
      const headers = await getAuthHeaders();
      const intentRes = await fetch("/api/v1/payments/intent", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId, acceptedPaymentTerms: true }),
      });
      const intentJson = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentJson.error?.message ?? "Intent failed");

      const { paymentId, uzumAppUrl } = intentJson.data ?? {};

      if (method === "uzum_app" && uzumAppUrl) {
        window.location.href = uzumAppUrl;
        return;
      }

      const checkoutRes = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ paymentId }),
      });
      const checkoutJson = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutJson.error?.message ?? "Checkout failed");

      const redirectUrl = checkoutJson.data?.redirectUrl;
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      setPayError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setPaying(null);
    }
  }

  const paymentsOn = paymentConfig?.paymentsEnabled ?? false;

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Подписка</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Тарифы</h1>
      </div>

      {currentPlan && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Ваш тариф</p>
          <p className="text-lg font-bold text-funding-black">{currentPlan.planName}</p>
          <p className="text-sm text-gray-500 mt-1">
            Проверки соответствия:{" "}
            {currentPlan.limits.eligibilityChecks === null
              ? `${currentPlan.used.eligibilityChecks} · без лимита`
              : `${currentPlan.used.eligibilityChecks}/${currentPlan.limits.eligibilityChecks} в месяц`}
            {" · "}
            AI-черновики:{" "}
            {currentPlan.limits.aiProposals === null
              ? `${currentPlan.used.aiProposals} · без лимита`
              : `${currentPlan.used.aiProposals}/${currentPlan.limits.aiProposals} в месяц`}
          </p>
          {currentPlan.planName === "Бесплатный" && (
            <p className="text-xs text-gray-400 mt-2">
              Бесплатный тариф: 2 проверки и 1 AI-черновик в месяц. Обновите тариф для большего лимита.
            </p>
          )}
        </div>
      )}

      {!paymentsOn && (
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
              {paymentConfig?.message ??
                "Вы можете отправить запрос на подключение тарифа, и команда FundingPro свяжется с вами в течение 24 часов."}
            </p>
          </div>
        </div>
      )}

      {paymentsOn && (
        <div
          className="flex items-start gap-3 rounded-2xl p-5 mb-8 border"
          style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
        >
          <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#14532D" }}>
              Оплата через Uzum Bank
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#166534" }}>
              Оплата в сумах (UZS){usdUzsRate ? ` по курсу 1 USD = ${usdUzsRate.toLocaleString("ru-RU")} UZS` : ""} на дату платежа.
              USD на сайте — справочно.
            </p>
            <label className="flex items-start gap-2 mt-3 text-xs cursor-pointer" style={{ color: "#166534" }}>
              <input
                type="checkbox"
                checked={acceptPaymentLegal}
                onChange={(e) => setAcceptPaymentLegal(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span>
                Принимаю{" "}
                <Link href="/legal/offer" className="underline font-medium" target="_blank">
                  оферту
                </Link>{" "}
                и{" "}
                <Link href="/legal/refunds" className="underline font-medium" target="_blank">
                  политику возвратов
                </Link>
              </span>
            </label>
            {payError && <p className="text-xs text-red-600 mt-2">{payError}</p>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : (
        <>
          {ngoPlans.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-funding-black mb-4">НКО и частные лица</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {ngoPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    paymentsOn={paymentsOn}
                    requested={requested === plan.id}
                    requesting={requesting === plan.id}
                    paying={paying?.startsWith(plan.id) ?? false}
                    onRequest={() => handleRequest(plan.id, plan.nameRu)}
                    onPayCheckout={() => handlePay(plan.id, "checkout")}
                    onPayUzumApp={() => handlePay(plan.id, "uzum_app")}
                  />
                ))}
              </div>
            </div>
          )}

          {businessPlans.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-funding-black mb-4">Бизнес</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {businessPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    paymentsOn={paymentsOn}
                    requested={requested === plan.id}
                    requesting={requesting === plan.id}
                    paying={paying?.startsWith(plan.id) ?? false}
                    onRequest={() => handleRequest(plan.id, plan.nameRu)}
                    onPayCheckout={() => handlePay(plan.id, "checkout")}
                    onPayUzumApp={() => handlePay(plan.id, "uzum_app")}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h3 className="font-bold text-sm text-funding-black mb-3">Гонорар за успех</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          2–5% от суммы полученного гранта — только при наличии предварительного письменного договора.
        </p>
        <p className="text-xs text-gray-400">
          <Link href="/legal/success-fee" className="text-funding-green underline">
            Подробнее о гонораре за успех
          </Link>
          . FundingPro не гарантирует получение гранта. Платформа не является платёжной, кредитной или микрофинансовой организацией.
        </p>
      </div>

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
            Данные карт обрабатывает Uzum Bank. FundingPro не хранит реквизиты карт.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  paymentsOn,
  requested,
  requesting,
  paying,
  onRequest,
  onPayCheckout,
  onPayUzumApp,
}: {
  plan: Plan;
  paymentsOn: boolean;
  requested: boolean;
  requesting: boolean;
  paying: boolean;
  onRequest: () => void;
  onPayCheckout: () => void;
  onPayUzumApp: () => void;
}) {
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
          Популярный
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: plan.highlighted ? "#A7B8AA" : "#6b7280" }}>
        {plan.nameRu}
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-black">{plan.pricePrimary}</span>
        <span className="text-sm" style={{ color: plan.highlighted ? "#A7B8AA" : "#9ca3af" }}>{plan.period}</span>
      </div>
      {plan.priceSecondary ? (
        <p className="text-xs mb-4" style={{ color: plan.highlighted ? "#A7B8AA" : "#6b7280" }}>
          {plan.priceSecondary}
        </p>
      ) : (
        <div className="mb-4" />
      )}
      <ul className="space-y-2 flex-1 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
            <span style={{ color: plan.highlighted ? "#D1FAE5" : "#4A5A4D" }}>{f}</span>
          </li>
        ))}
      </ul>

      {paymentsOn ? (
        <div className="space-y-2">
          <button
            onClick={onPayCheckout}
            disabled={paying}
            className="w-full py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={
              plan.highlighted
                ? { background: "#008A2E", color: "#fff" }
                : { background: "#F0FDF4", color: "#008A2E", border: "1px solid #BBF7D0" }
            }
          >
            {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CreditCard className="w-3.5 h-3.5" /> Оплатить картой</>}
          </button>
          <button
            onClick={onPayUzumApp}
            disabled={paying}
            className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ color: plan.highlighted ? "#A7B8AA" : "#6b7280", border: "1px solid", borderColor: plan.highlighted ? "rgba(167,184,170,0.3)" : "#e5e7eb" }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Uzum Bank
          </button>
        </div>
      ) : requested ? (
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
          disabled={requesting}
          className="w-full py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={
            plan.highlighted
              ? { background: "#008A2E", color: "#fff" }
              : { background: "#F0FDF4", color: "#008A2E", border: "1px solid #BBF7D0" }
          }
        >
          {requesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Запросить подключение <ChevronRight className="w-3.5 h-3.5" /></>}
        </button>
      )}
    </div>
  );
}
