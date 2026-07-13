import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { PricingCard } from "@/components/design/PricingCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { JsonLd } from "@/components/seo/JsonLd";
import { listIndividualPlans, listPlans } from "@/lib/db/plans";
import { formatPlanPriceDisplay } from "@/lib/format-plan";
import { getUsdUzsRate } from "@/lib/legal/documents";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";
import { ArrowRight } from "lucide-react";

const pageTitle = "Тарифы и подписки";
const pageDescription =
  "Тарифные планы FundingPro для физических лиц: поиск грантов, AI-проверка соответствия, черновики заявок. Оплата в UZS через Uzum.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: openGraphPage(pageTitle, pageDescription, "/pricing"),
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${siteConfig.name}`,
    description: pageDescription,
  },
  alternates: hreflangAlternates("/pricing"),
};

export default async function PricingPage() {
  let plans: Awaited<ReturnType<typeof listPlans>> = [];
  try {
    plans = listIndividualPlans(await listPlans());
  } catch {
    plans = [];
  }
  const usdUzsRate = getUsdUzsRate();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${siteConfig.name} — подписка`,
    description: pageDescription,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.nameRu,
      price: plan.priceUsd,
      priceCurrency: "USD",
      url: absoluteUrl("/auth"),
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <JsonLd data={productJsonLd} />
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            Начать <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">Тарифы</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3">
          Выберите план FundingPro
        </h1>
        <p className="text-sm text-gray-500 mb-10 max-w-2xl">
          Для физических лиц в Узбекистане. Бесплатный старт: 2 проверки соответствия
          и 1 AI-черновик в месяц.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-500">
              Тарифы временно недоступны.{" "}
              <Link href="/auth" className="text-funding-green hover:underline">
                Войти в дашборд
              </Link>
            </p>
          )}
          {plans.map((plan) => {
            const display = formatPlanPriceDisplay(plan.priceUzs, plan.priceUsd);
            return (
              <PricingCard
                key={plan.id}
                name={plan.nameRu}
                price={display.primary}
                priceSecondary={display.secondary}
                features={plan.features.slice(0, 8)}
                cta={plan.highlighted ? "Выбрать план" : "Начать"}
                highlighted={plan.highlighted}
                href="/auth"
              />
            );
          })}
        </div>

        <p className="text-center text-xs mt-8 text-gray-400">
          Цены в сумах (UZS)
          {usdUzsRate ? `, курс 1 USD = ${usdUzsRate.toLocaleString("ru-RU")} UZS` : ""}. USD — справочно.
          {" "}Гонорар за успех: 2–5% — см.{" "}
          <Link href="/legal/success-fee" className="text-funding-green underline">
            условия
          </Link>
          .
        </p>
      </main>

      <footer className="px-6 py-8 border-t border-gray-100">
        <LegalFooter className="max-w-6xl mx-auto" />
      </footer>
    </div>
  );
}
