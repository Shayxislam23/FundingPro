"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

export default function ZoomradPaymentPage() {
  const searchParams = useSearchParams();
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";
  const planId = searchParams.get("planId");
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return (
    <ZoomradShell
      title={locale === "uz" ? "To‘lov" : "Оплата"}
      subtitle={
        locale === "uz"
          ? "ZOOMRAD orqali xavfsiz to‘lov"
          : "Безопасная оплата через ZOOMRAD"
      }
    >
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 text-sm shadow-sm">
        {!planId ? (
          <p className="text-neutral-600">
            {locale === "uz" ? "Avval tarifni tanlang." : "Сначала выберите тариф."}
          </p>
        ) : (
          <p className="text-neutral-700">
            {locale === "uz" ? "Tanlangan tarif:" : "Выбранный тариф:"}{" "}
            <span className="font-semibold">{planId}</span>
          </p>
        )}
        <p className="text-xs text-neutral-500">
          {locale === "uz"
            ? "To‘lov faqat imzolangan server webhook orqali faollashtiriladi."
            : "Активация только через подписанный server webhook."}
        </p>
        <Link
          href={`/auth?redirect=${encodeURIComponent(`/dashboard/subscription${planId ? `?plan=${planId}` : ""}`)}`}
          className="block rounded-xl bg-[#008A2E] px-4 py-3 text-center font-semibold text-white"
        >
          {locale === "uz" ? "Davom etish" : "Продолжить"}
        </Link>
        <Link
          href={`/zoomrad/pricing${suffix.replace(`planId=${planId}`, "").replace(/^\?&/, "?")}`}
          className="block text-center text-sm text-emerald-700"
        >
          {locale === "uz" ? "Tariflarga qaytish" : "Назад к тарифам"}
        </Link>
      </div>
    </ZoomradShell>
  );
}
