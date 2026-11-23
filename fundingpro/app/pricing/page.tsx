import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { PricingCard } from "@/components/design/PricingCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { JsonLd } from "@/components/seo/JsonLd";
import { listPlans, type PlanRow } from "@/lib/db/plans";
import { formatPlanPriceDisplay } from "@/lib/format-plan";
import { getUsdUzsRate } from "@/lib/legal/documents";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";
import { ArrowRight } from "lucide-react";
import { ServiceOffers } from "@/components/offers/ServiceOffers";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { withLang } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";
import { getPageLocale } from "@/lib/i18n/server";

type PageProps = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getPageLocale((await searchParams).lang);
  const t = getPublicDict(locale).pricing;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    openGraph: openGraphPage(t.metaTitle, t.metaDescription, withLang("/pricing", locale)),
    twitter: {
      card: "summary_large_image",
      title: `${t.metaTitle} | ${siteConfig.name}`,
      description: t.metaDescription,
    },
    alternates: hreflangAlternates("/pricing"),
  };
}

export default async function PricingPage({ searchParams }: PageProps) {
  const locale = await getPageLocale((await searchParams).lang);
  const dict = getPublicDict(locale);
  const t = dict.pricing;
  let plans: PlanRow[] = [];
  try {
    plans = await listPlans();
  } catch {
    plans = [];
  }
  // Subscription names/features live in the database in Russian only — keep the Uzbek page monolingual.
  if (locale === "uz") plans = [];
  const usdUzsRate = getUsdUzsRate();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${siteConfig.name} — ${t.title}`,
    description: t.metaDescription,
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
    <div lang={locale} className="min-h-screen bg-funding-light-bg flex flex-col">
      <JsonLd data={productJsonLd} />
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href={withLang("/", locale)}>
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} path="/pricing" />
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            {dict.nav.start} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">{t.label}</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3 break-words">
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mb-10 max-w-2xl">
          {t.lead}
        </p>

        <ServiceOffers locale={locale} />

        {plans.length > 0 && (
          <h2 className="text-xl font-black text-funding-black mt-14 mb-6">{dict.offers.subscriptions}</h2>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const display = formatPlanPriceDisplay(plan.priceUzs, plan.priceUsd);
            return (
              <PricingCard
                key={plan.id}
                name={plan.nameRu}
                price={display.primary}
                priceSecondary={display.secondary}
                features={plan.features.slice(0, 8)}
                cta={plan.highlighted ? (locale === "uz" ? "Rejani tanlash" : "Выбрать план") : dict.nav.start}
                highlighted={plan.highlighted}
                href="/auth"
              />
            );
          })}
        </div>

        <p className="text-center text-xs mt-8 text-gray-400">
          {dict.offers.pricesNote}{" "}
          <Link href={withLang("/legal/success-fee", locale)} className="text-funding-green underline">
            {dict.offers.terms}
          </Link>
          .{usdUzsRate ? ` 1 USD = ${usdUzsRate.toLocaleString("ru-RU")} UZS.` : ""}
        </p>
      </main>

      <footer className="px-6 py-8 border-t border-gray-100">
        <LegalFooter locale={locale} className="max-w-6xl mx-auto" />
      </footer>
    </div>
  );
}
