import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { GrantCard } from "@/components/design/GrantCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { listPublicGrants } from "@/lib/public-grants";
import {
  formatGrantAmount,
  formatDeadlineDate,
  getDeadlineUrgency,
} from "@fundingpro/shared";
import { translateSector } from "@fundingpro/shared";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";
import { ArrowRight } from "lucide-react";

const pageTitle = "Каталог грантов";
const pageDescription =
  "Актуальные международные гранты для организаций и бизнеса в Узбекистане. Фильтр по стране, сектору и дедлайну.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: openGraphPage(pageTitle, pageDescription, "/grants"),
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${siteConfig.name}`,
    description: pageDescription,
  },
  alternates: hreflangAlternates("/grants"),
};

const DEFAULT_COUNTRY = "Uzbekistan";

type PageProps = {
  searchParams: Promise<{ country?: string; page?: string; q?: string }>;
};

export default async function PublicGrantsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const countryParam = sp.country;
  const countryFilter = countryParam === undefined ? DEFAULT_COUNTRY : countryParam;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.q?.trim() ?? "";

  let grants: Awaited<ReturnType<typeof listPublicGrants>>["grants"] = [];
  let total = 0;
  let pages = 1;

  try {
    const result = await listPublicGrants({
      ...(countryFilter ? { country: countryFilter } : {}),
      page,
      limit: 24,
      search: search || undefined,
    });
    grants = result.grants;
    total = result.total;
    pages = result.pages;
  } catch {
    grants = [];
  }

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/grants"),
    numberOfItems: total,
    itemListElement: grants.slice(0, 10).map((grant, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/grants/${grant.id}`),
      name: grant.title_ru ?? grant.title,
    })),
  };

  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <JsonLd data={itemListJsonLd} />
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#008A2E" }}
          >
            Войти <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">Публичный каталог</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-2">
          Гранты для Узбекистана
        </h1>
        <p className="text-sm text-gray-500 mb-8 max-w-2xl">
          {total > 0
            ? `${total} активных возможностей финансирования. Войдите в дашборд для AI-подбора и подготовки заявки.`
            : "Каталог грантов. Войдите в дашборд для полного доступа и AI-подбора."}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: "Узбекистан", value: DEFAULT_COUNTRY, href: "/grants" },
            { label: "Казахстан", value: "Kazakhstan", href: "/grants?country=Kazakhstan" },
            { label: "Все страны", value: "", href: "/grants?country=" },
          ].map(({ label, value, href }) => {
            const active = countryFilter === value;
            return (
              <Link
                key={label}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-funding-green text-white border-funding-green"
                    : "bg-white text-gray-600 border-gray-200 hover:border-funding-green/40"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {grants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-4">Гранты не найдены для выбранного фильтра.</p>
            <Link href="/auth" className="text-sm font-semibold text-funding-green hover:underline">
              Войти и открыть полную базу →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grants.map((grant) => {
              const title = grant.title_ru ?? grant.title;
              const donor = grant.donor.name_ru ?? grant.donor.name;
              return (
                <Link key={grant.id} href={`/grants/${grant.id}`} className="block">
                  <GrantCard
                    id={grant.id}
                    title={title}
                    donor={donor}
                    amount={formatGrantAmount(grant.amount_min, grant.amount_max)}
                    deadline={formatDeadlineDate(grant.deadline)}
                    deadlineUrgency={getDeadlineUrgency(grant.deadline)}
                    country={grant.country_scope?.[0]}
                    sector={
                      grant.sectors?.[0] ? translateSector(grant.sectors[0]) : undefined
                    }
                  />
                </Link>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <nav className="flex justify-center gap-3 mt-10">
            {page > 1 && (
              <Link
                href={`/grants?${countryParam !== undefined ? `country=${encodeURIComponent(countryFilter)}&` : ""}page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:border-funding-green/40"
              >
                ← Назад
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              Страница {page} из {pages}
            </span>
            {page < pages && (
              <Link
                href={`/grants?${countryParam !== undefined ? `country=${encodeURIComponent(countryFilter)}&` : ""}page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:border-funding-green/40"
              >
                Далее →
              </Link>
            )}
          </nav>
        )}
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
