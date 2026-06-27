"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ShieldCheck, Clock, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { SubscriptionPlans } from "./components/SubscriptionPlans";
import { useSubscriptionCheckout } from "./hooks/useSubscriptionCheckout";
import { mapApiPlan, type PaymentConfig, type Plan } from "./types";

export default function SubscriptionPage() {
  const [ngoPlans, setNgoPlans] = useState<Plan[]>([]);
  const [businessPlans, setBusinessPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [usdUzsRate, setUsdUzsRate] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<{
    planName: string;
    limits: { eligibilityChecks: number | null; aiProposals: number | null };
    used: { eligibilityChecks: number; aiProposals: number };
  } | null>(null);

  const {
    requested,
    requesting,
    requestError,
    requestSuccess,
    paying,
    payError,
    acceptPaymentLegal,
    setAcceptPaymentLegal,
    handleRequest,
    handlePay,
    enabledProviders,
    paymentsOn,
  } = useSubscriptionCheckout(paymentConfig);

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
                "Отправьте запрос на подключение — команда FundingPro свяжется с вами по email в течение 1–2 рабочих дней."}
            </p>
          </div>
        </div>
      )}

      {requestSuccess && (
        <div
          className="flex items-start gap-3 rounded-2xl p-5 mb-6 border"
          style={{ background: "#D9F7DD", borderColor: "#BBF7D0" }}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-funding-green" />
          <div>
            <p className="text-sm font-semibold text-funding-green mb-1">Запрос получен</p>
            <p className="text-sm text-gray-600">
              Тариф «{requestSuccess}» — мы свяжемся с вами по email в течение 1–2 рабочих дней.
            </p>
          </div>
        </div>
      )}

      {requestError && (
        <div className="rounded-2xl p-4 mb-6 bg-red-50 text-red-600 text-sm">{requestError}</div>
      )}

      {paymentsOn && (
        <div
          className="flex items-start gap-3 rounded-2xl p-5 mb-8 border"
          style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
        >
          <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#14532D" }}>
              Оплата через Uzum Bank, Payme или Click
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
        <SubscriptionPlans
          ngoPlans={ngoPlans}
          businessPlans={businessPlans}
          paymentsOn={paymentsOn}
          requested={requested}
          requesting={requesting}
          paying={paying}
          enabledProviders={enabledProviders}
          onRequest={handleRequest}
          onPay={handlePay}
        />
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
            Данные карт обрабатывают Uzum Bank, Payme и Click. FundingPro не хранит реквизиты карт.
          </p>
        </div>
      </div>
    </div>
  );
}
