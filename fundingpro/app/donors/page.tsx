import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { listPublicDonors } from "@/lib/public-donors";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";
import { ArrowRight, Globe } from "lucide-react";

const pageTitle = "Доноры и фонды";
const pageDescription =
  "Международные доноры и фонды, гранты которых доступны в каталоге FundingPro: ПРООН, ЕС, GIZ, Всемирный банк и другие.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: openGraphPage(pageTitle, pageDescription, "/donors"),
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${siteConfig.name}`,
    description: pageDescription,
  },
  alternates: hreflangAlternates("/donors"),
};

export default async function DonorsPage() {
  const donors = await listPublicDonors();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/donors"),
    numberOfItems: donors.length,
    itemListElement: donors.slice(0, 10).map((donor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: donor.nameRu ?? donor.name,
    })),
  };

  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <JsonLd data={itemListJsonLd} />
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
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

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">Партнёры</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3">
          Доноры в базе FundingPro
        </h1>
        <p className="text-sm text-gray-500 mb-10 max-w-2xl">
          Международные организации и фонды, чьи грантовые программы индексируются в нашей базе.
          Перейдите в каталог, чтобы увидеть актуальные возможности.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {donors.map((donor) => {
            const displayName = donor.nameRu ?? donor.name;
            return (
              <div
                key={donor.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 hover:border-funding-green/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#D9F7DD" }}
                >
                  <Globe className="w-5 h-5" style={{ color: "#008A2E" }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-funding-black">{displayName}</h2>
                  {donor.nameRu && donor.name !== donor.nameRu && (
                    <p className="text-xs text-gray-400 mt-0.5">{donor.name}</p>
                  )}
                  <Link
                    href={`/grants?q=${encodeURIComponent(donor.name)}`}
                    className="inline-block text-xs font-medium text-funding-green mt-3 hover:underline"
                  >
                    Смотреть гранты →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/grants"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            Открыть каталог грантов <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
