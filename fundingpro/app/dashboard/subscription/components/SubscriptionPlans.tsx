"use client";

import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { ProviderPicker } from "./ProviderPicker";
import type { PaymentProvider, Plan } from "../types";

type SubscriptionPlansProps = {
  ngoPlans: Plan[];
  businessPlans: Plan[];
  paymentsOn: boolean;
  requested: Set<string>;
  requesting: string | null;
  paying: string | null;
  enabledProviders: PaymentProvider[];
  onRequest: (planId: string, planName: string) => void;
  onPay: (planId: string, provider: "uzum" | "payme" | "click", method?: "checkout") => void;
};

export function SubscriptionPlans({
  ngoPlans,
  businessPlans,
  paymentsOn,
  requested,
  requesting,
  paying,
  enabledProviders,
  onRequest,
  onPay,
}: SubscriptionPlansProps) {
  return (
    <>
      {ngoPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-funding-black mb-4">Для физических лиц</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {ngoPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                paymentsOn={paymentsOn}
                requested={requested.has(plan.id)}
                requesting={requesting === plan.id}
                paying={paying?.startsWith(plan.id) ?? false}
                onRequest={() => onRequest(plan.id, plan.nameRu)}
                onPay={(provider, method) => onPay(plan.id, provider, method)}
                enabledProviders={enabledProviders}
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
                requested={requested.has(plan.id)}
                requesting={requesting === plan.id}
                paying={paying?.startsWith(plan.id) ?? false}
                onRequest={() => onRequest(plan.id, plan.nameRu)}
                onPay={(provider, method) => onPay(plan.id, provider, method)}
                enabledProviders={enabledProviders}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PlanCard({
  plan,
  paymentsOn,
  requested,
  requesting,
  paying,
  onRequest,
  onPay,
  enabledProviders,
}: {
  plan: Plan;
  paymentsOn: boolean;
  requested: boolean;
  requesting: boolean;
  paying: boolean;
  onRequest: () => void;
  onPay: (provider: "uzum" | "payme" | "click", method?: "checkout") => void;
  enabledProviders: PaymentProvider[];
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

      {paymentsOn && enabledProviders.length > 0 ? (
        <ProviderPicker
          providers={enabledProviders}
          paying={paying}
          highlighted={plan.highlighted}
          onPay={onPay}
        />
      ) : requested ? (
        <div className="space-y-2">
          <div
            className="w-full py-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2"
            style={{ background: "rgba(0,138,46,0.15)", color: "#12B94F" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Запрос отправлен
          </div>
          <p className="text-[10px] text-center leading-relaxed" style={{ color: plan.highlighted ? "#A7B8AA" : "#9ca3af" }}>
            Ответ придёт на ваш email в течение 1–2 рабочих дней
          </p>
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
          {requesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>Запросить подключение <ChevronRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}
