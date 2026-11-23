import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPageLocale } from "@/lib/i18n/server";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";

type PageProps = { searchParams: Promise<{ lang?: string }> };

const META = {
  ru: {
    title: `${siteConfig.name} — гранты для бизнеса и молодёжи Узбекистана`,
    description:
      "Бесплатный каталог проверенных грантов, программа «Мой путь» с наставником и заявка под ключ для бизнеса. Гонорар только за успех.",
  },
  uz: {
    title: `${siteConfig.name} — O‘zbekiston biznesi va yoshlari uchun grantlar`,
    description:
      "Tekshirilgan grantlarning bepul katalogi, murabbiy bilan «Mening yo‘lim» dasturi va biznes uchun tayyor ariza. Haq faqat g‘alaba uchun.",
  },
} as const;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getPageLocale((await searchParams).lang);
  const m = META[locale];
  return {
    title: { absolute: m.title },
    description: m.description,
    openGraph: { ...openGraphPage(m.title, m.description, locale === "uz" ? "/?lang=uz" : "/"), locale: locale === "uz" ? "uz_UZ" : "ru_RU" },
    twitter: { card: "summary_large_image", title: m.title, description: m.description },
    alternates: hreflangAlternates("/"),
  };
}

export default async function LandingPage({ searchParams }: PageProps) {
  const locale = await getPageLocale((await searchParams).lang);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: META[locale].description,
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: ["ru", "uz"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/grants")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      <LandingPageClient locale={locale} />
    </>
  );
}
