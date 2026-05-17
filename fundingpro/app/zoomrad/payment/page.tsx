"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";

type PaymentState = "confirm" | "processing" | "success" | "pending" | "failed";

const planLabels: Record<string, { name: string; price: string }> = {
  "ngo-basic": { name: "НКО Basic", price: "$30/мес" },
  "ngo-pro": { name: "НКО Pro", price: "$50/мес" },
  consulting: { name: "Consulting", price: "$100/мес" },
  "business-starter": { name: "Бизнес Starter", price: "$90/мес" },
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "ngo-pro";
  const plan = planLabels[planId] ?? { name: "НКО Pro", price: "$50/мес" };

  const [state, setState] = useState<PaymentState>("confirm");

  const handlePay = () => {
    setState("processing");
    // Simulate async webhook-based activation
    setTimeout(() => {
      const outcome: PaymentState = "success";
      setState(outcome);
    }, 2500);
  };

  if (state === "processing") {
    return (
      <ZoomradShell variant="dark" title="Оплата">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
          <div
            className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin mb-6"
            style={{ borderColor: "#008A2E", borderTopColor: "transparent" }}
          />
          <h2 className="text-lg font-bold text-white mb-2">Обрабатываем платёж</h2>
          <p className="text-sm text-center" style={{ color: "#A7B8AA" }}>
            Пожалуйста, не закрывайте страницу
          </p>
        </div>
      </ZoomradShell>
    );
  }

  if (state === "success") {
    return (
      <ZoomradShell variant="dark" title="Оплата">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(0,138,46,0.15)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "#12B94F" }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Подписка активирована</h2>
          <p className="text-sm mb-2" style={{ color: "#12B94F" }}>{plan.name} — {plan.price}</p>
          <p className="text-sm mb-8 max-w-xs" style={{ color: "#A7B8AA" }}>
            Доступ к функциям платформы открыт. Начните поиск грантов прямо сейчас.
          </p>
          <a
            href="/zoomrad/grants"
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: "#008A2E" }}
          >
            Перейти к грантам
          </a>
          <p className="text-xs mt-5" style={{ color: "rgba(167,184,170,0.4)" }}>
            Подтверждение придёт в ZOOMRAD и на e-mail
          </p>
        </div>
      </ZoomradShell>
    );
  }

  if (state === "pending") {
    return (
      <ZoomradShell variant="dark" title="Оплата">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(251,191,36,0.1)" }}
          >
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Платёж обрабатывается</h2>
          <p className="text-sm mb-8 max-w-xs" style={{ color: "#A7B8AA" }}>
            Мы уведомим вас, как только платёж будет подтверждён ZOOMRAD.
          </p>
          <a href="/zoomrad/welcome" className="text-sm font-semibold" style={{ color: "#12B94F" }}>
            На главную
          </a>
        </div>
      </ZoomradShell>
    );
  }

  if (state === "failed") {
    return (
      <ZoomradShell variant="dark" title="Оплата">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Платёж не прошёл</h2>
          <p className="text-sm mb-8 max-w-xs" style={{ color: "#A7B8AA" }}>
            Проверьте баланс или попробуйте снова.
          </p>
          <button
            onClick={() => setState("confirm")}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: "#008A2E" }}
          >
            Попробовать снова
          </button>
        </div>
      </ZoomradShell>
    );
  }

  return (
    <ZoomradShell variant="dark" title="Оплата" showBack>
      <div className="px-5 pt-5 pb-10">
        {/* Order summary */}
        <div
          className="p-5 rounded-2xl border mb-5"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(0,138,46,0.3)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#A7B8AA" }}>
            К оплате
          </p>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">{plan.name}</span>
            <span className="text-2xl font-black" style={{ color: "#12B94F" }}>{plan.price}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(167,184,170,0.6)" }}>
            Подписка активируется после подтверждения ZOOMRAD
          </p>
        </div>

        {/* Security note */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-6"
          style={{ background: "rgba(0,138,46,0.08)" }}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#12B94F" }} />
          <div>
            <p className="text-xs font-semibold text-white mb-0.5">Безопасная оплата</p>
            <p className="text-xs leading-relaxed" style={{ color: "#A7B8AA" }}>
              Платёж обрабатывается через ZOOMRAD. FundingPro не хранит данные карт и не
              является платёжной организацией.
            </p>
          </div>
        </div>

        <button
          onClick={handlePay}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white mb-4"
          style={{ background: "#008A2E" }}
        >
          Оплатить через ZOOMRAD
        </button>

        <p className="text-xs text-center" style={{ color: "rgba(167,184,170,0.5)" }}>
          Нажимая «Оплатить», вы принимаете условия использования FundingPro
        </p>
      </div>
    </ZoomradShell>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-funding-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#008A2E", borderTopColor: "transparent" }} /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
