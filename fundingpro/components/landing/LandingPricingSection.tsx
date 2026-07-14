import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { PricingCard } from "@/components/design/PricingCard";
import { formatPlanPriceDisplay } from "@/lib/format-plan";
import type { LandingPlan } from "@/components/landing/landingConstants";

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
          <SectionLabel className="text-funding-green">Тарифы</SectionLabel>
          <h2 className="text-4xl font-black mb-3" style={{ color: "#050505" }}>
            Выберите план
          </h2>
          <p className="max-w-lg mx-auto text-sm" style={{ color: "#6b7280" }}>
            Для бизнеса, молодёжи и частных лиц.{" "}
            <Link href="/pricing" className="text-funding-green hover:underline">
              Все тарифы
            </Link>
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansLoading && (
            <p className="col-span-full text-center text-sm text-gray-400">Загрузка тарифов…</p>
          )}
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
          {!plansLoading && plans.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-500">
              Тарифы временно недоступны.{" "}
              <Link href="/auth" className="text-funding-green hover:underline">
                Войти в дашборд
              </Link>
            </p>
          )}
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
