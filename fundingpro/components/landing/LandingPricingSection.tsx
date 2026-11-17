import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { PricingCard } from "@/components/design/PricingCard";
import { formatPlanPriceDisplay } from "@/lib/format-plan";
import type { LandingPlan } from "@/components/landing/landingConstants";
import { ServiceOffers } from "@/components/offers/ServiceOffers";

type LandingPricingSectionProps = {
  plans: LandingPlan[];
  plansLoading: boolean;
  usdUzsRate: number | null;
};

export function LandingPricingSection({ plans, plansLoading, usdUzsRate }: LandingPricingSectionProps) {
  return (
    <section id="pricing" className="py-20 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="text-funding-green">Что вы получаете</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: "#050505" }}>
            Три способа получить грант
          </h2>
          <p className="max-w-lg mx-auto text-sm" style={{ color: "#6b7280" }}>
            Начните бесплатно. Платите за сопровождение, когда нужна помощь.{" "}
            <Link href="/pricing" className="text-funding-green hover:underline">
              Все цены
            </Link>
          </p>
        </div>
        <ServiceOffers />
        {!plansLoading && plans.length > 0 && (
          <h3 className="text-xl font-black text-center mt-16 mb-6" style={{ color: "#050505" }}>
            Подписка для самостоятельной работы
          </h3>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {!plansLoading &&
            plans.map((plan) => {
              const display = formatPlanPriceDisplay(plan.priceUzs, plan.priceUsd);
              return (
                <PricingCard
                  key={plan.id}
                  name={plan.nameRu}
                  price={display.primary}
                  priceSecondary={display.secondary}
                  features={plan.features.slice(0, 6)}
                  cta={plan.highlighted ? "Выбрать план" : "Начать"}
                  highlighted={plan.highlighted}
                  href="/auth"
                />
              );
            })}
        </div>
        <p className="text-center text-xs mt-8" style={{ color: "#9ca3af" }}>
          Цены в сумах (UZS)
          {usdUzsRate ? `, курс 1 USD = ${usdUzsRate.toLocaleString("ru-RU")} UZS` : ""}. USD — справочно. Гонорар
          за успех: 2–5% — см.{" "}
          <Link href="/legal/success-fee" className="text-funding-green underline">
            условия
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
