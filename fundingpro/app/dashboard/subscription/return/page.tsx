"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SectionLabel } from "@/components/design/SectionLabel";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

function SubscriptionReturnContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      setMessage("Не указан идентификатор платежа.");
      return;
    }

    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/v1/payments/checkout/return?paymentId=${encodeURIComponent(paymentId)}`,
          { headers }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Ошибка проверки оплаты");

        if (json.data?.activated) {
          setStatus("success");
          setMessage("Подписка активирована. Спасибо за оплату!");
        } else {
          setStatus("pending");
          setMessage(
            "Платёж обрабатывается. Обновите страницу через минуту или свяжитесь с поддержкой."
          );
        }
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Ошибка проверки оплаты");
      }
    })();
  }, [paymentId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-funding-green mx-auto mb-4" />
          <p className="text-sm text-gray-600">Проверяем статус платежа…</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="w-10 h-10 mx-auto mb-4" style={{ color: "#008A2E" }} />
          <p className="text-sm font-semibold text-funding-black mb-2">{message}</p>
        </>
      )}
      {status === "pending" && (
        <>
          <Loader2 className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600">{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600">{message}</p>
        </>
      )}

      <Link
        href="/dashboard/subscription"
        className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#008A2E" }}
      >
        К тарифам
      </Link>
    </div>
  );
}

export default function SubscriptionReturnPage() {
  return (
    <div className="max-w-lg mx-auto py-12">
      <SectionLabel>Подписка</SectionLabel>
      <h1 className="text-2xl font-black text-funding-black mb-6">Результат оплаты</h1>
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-funding-green mx-auto mb-4" />
            <p className="text-sm text-gray-600">Загрузка…</p>
          </div>
        }
      >
        <SubscriptionReturnContent />
      </Suspense>
    </div>
  );
}
