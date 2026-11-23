import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { withLang } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";
import { getPageLocale } from "@/lib/i18n/server";
import { hreflangAlternates, openGraphPage } from "@/lib/seo/site";
import { BusinessRequestForm } from "./BusinessRequestForm";

type PageProps = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getPageLocale((await searchParams).lang);
  const t = getPublicDict(locale).business;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    openGraph: openGraphPage(t.metaTitle, t.metaDescription, withLang("/business", locale)),
    alternates: hreflangAlternates("/business"),
  };
}

export default async function BusinessPage({ searchParams }: PageProps) {
  const locale = await getPageLocale((await searchParams).lang);
  const t = getPublicDict(locale).business;
  return (
    <div lang={locale} className="min-h-screen bg-funding-light-bg flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href={withLang("/", locale)}>
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} path="/business" />
            <Link
              href={withLang("/grants", locale)}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-funding-green"
            >
              {t.catalogLink} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionLabel className="text-funding-green">{t.label}</SectionLabel>
          <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3 break-words">{t.title}</h1>
          <p className="text-gray-600 mb-8">{t.lead}</p>
          <ol className="space-y-4">
            {t.steps.map(({ t: title, d }, i) => (
              <li key={title} className="flex gap-3">
                <span className="w-8 h-8 shrink-0 rounded-full bg-funding-green text-white text-sm font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-funding-black">{title}</p>
                  <p className="text-sm text-gray-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-8">{t.disclaimer}</p>
        </section>
        <section>
          <BusinessRequestForm locale={locale} />
        </section>
      </main>
      <div className="text-center py-8 px-6">
        <LegalFooter locale={locale} />
      </div>
    </div>
  );
}
