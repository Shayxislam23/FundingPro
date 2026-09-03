"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PricingCard } from "@/components/design/PricingCard";
import { EmptyState } from "@/components/design/EmptyState";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

type PlanView = {
  id: string;
  nameRu: string;
  priceUsd: number;
  features: string[];
  highlighted: boolean;
  priceLabel: string;
};

type ZoomradPricingClientProps = {
  plans: PlanView[];
  searchParams: { channel?: string; lang?: string };
};

export function ZoomradPricingClient({ plans, searchParams }: ZoomradPricingClientProps) {
  const locale = searchParams.lang === "uz" ? "uz" : "ru";
  const suffix = useMemo(() => {
    const q = new URLSearchParams();
    if (searchParams.channel) q.set("channel", searchParams.channel);
    if (searchParams.lang) q.set("lang", searchParams.lang);
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [searchParams]);

  return (
    <ZoomradShell
      title={locale === "uz" ? "Tariflar" : "Тарифы"}
      subtitle={
        locale === "uz"
          ? "To‘lov ZOOMRAD orqali — xavfsiz server webhook bilan faollashtiriladi"
          : "Оплата через ZOOMRAD — активация по защищённому webhook"
      }
    >
      {plans.length === 0 ? (
        <EmptyState
          title={locale === "uz" ? "Tariflar mavjud emas" : "Тарифы недоступны"}
          description={
            locale === "uz" ? "Katalog yangilanmoqda." : "Каталог тарифов обновляется."
          }
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.nameRu}
              price={plan.priceLabel}
              features={plan.features}
              highlighted={plan.highlighted}
              cta={locale === "uz" ? "To‘lash" : "Оплатить"}
              href={`/zoomrad/payment?planId=${encodeURIComponent(plan.id)}${suffix ? `&${suffix.slice(1)}` : ""}`}
            />
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-neutral-500">
        {locale === "uz"
          ? "Bu kredit emas — grant xizmatlari uchun obuna."
          : "Это не кредит — подписка на сервисы по грантам."}
      </p>
    </ZoomradShell>
  );
}
