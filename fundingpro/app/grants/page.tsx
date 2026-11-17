import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { GrantCard } from "@/components/design/GrantCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { listPublicGrants, type GrantListItem } from "@/lib/public-grants";
import {
  formatGrantAmount,
  formatDeadlineDate,
  getDeadlineUrgency,
} from "@fundingpro/shared";
import { translateSector } from "@fundingpro/shared";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, hreflangAlternates, openGraphPage, siteConfig } from "@/lib/seo/site";
import { ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { withLang, type Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";
import { getPageLocale } from "@/lib/i18n/server";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getPageLocale((await searchParams).lang);
  const t = getPublicDict(locale).catalog;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    openGraph: openGraphPage(t.metaTitle, t.metaDescription, withLang("/grants", locale)),
    twitter: {
      card: "summary_large_image",
      title: `${t.metaTitle} | ${siteConfig.name}`,
      description: t.metaDescription,
    },
    alternates: hreflangAlternates("/grants"),
  };
}

const DEFAULT_COUNTRY = "Uzbekistan";

const AUDIENCES = [
  { key: "all", value: "" },
  { key: "business", value: "business" },
  { key: "startup", value: "startup" },
  { key: "individual", value: "individual" },
  { key: "ngo", value: "ngo" },
] as const;

type PageProps = {
  searchParams: Promise<{ country?: string; page?: string; q?: string; for?: string; lang?: string }>;
};

function catalogHref(params: { country?: string; for?: string; page?: number; q?: string; locale?: Locale }): string {
  const sp = new URLSearchParams();
  if (params.locale === "uz") sp.set("lang", "uz");
  if (params.country !== undefined) sp.set("country", params.country);
  if (params.for) sp.set("for", params.for);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/grants?${qs}` : "/grants";
}

export default async function PublicGrantsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = await getPageLocale(sp.lang);
  const t = getPublicDict(locale).catalog;
  const countryParam = sp.country;
  const countryFilter = countryParam === undefined ? DEFAULT_COUNTRY : countryParam;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.q?.trim() ?? "";
  const audience = AUDIENCES.some((a) => a.value === sp.for) ? (sp.for ?? "") : "";

  let grants: GrantListItem[] = [];
  let total = 0;
  let pages = 1;

  try {
    const result = await listPublicGrants({
      ...(countryFilter ? { country: countryFilter } : {}),
      ...(audience ? { applicantType: audience } : {}),
      activeOnly: true,
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
    name: t.metaTitle,
    description: t.metaDescription,
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
    <div lang={locale} className="min-h-screen bg-funding-light-bg flex flex-col">
      <JsonLd data={itemListJsonLd} />
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href={withLang("/", locale)}>
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} path={catalogHref({ country: countryParam, for: audience, q: search })} />
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#008A2E" }}
          >
            {getPublicDict(locale).nav.login} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">{t.label}</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-2">
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mb-8 max-w-2xl">
          {total > 0
            ? t.count(total)
            : t.countEmpty}
        </p>

        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">{t.forWhom}</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(({ key, value }) => {
              const active = audience === value;
              const label = t.audiences[key];
              return (
                <Link
                  key={key}
                  href={catalogHref({ country: countryParam, for: value, q: search, locale })}
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
        </div>
        <p className="text-xs font-semibold text-gray-500 mb-2">{t.country}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: t.countries.uz, value: DEFAULT_COUNTRY, href: catalogHref({ for: audience, locale }) },
            { label: t.countries.kz, value: "Kazakhstan", href: catalogHref({ country: "Kazakhstan", for: audience, locale }) },
            { label: t.countries.all, value: "", href: catalogHref({ country: "", for: audience, locale }) },
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
            <p className="text-gray-500 mb-4">{t.empty}</p>
            <Link href={withLang("/business", locale)} className="text-sm font-semibold text-funding-green hover:underline">
              {t.emptyCta}
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
                href={catalogHref({ country: countryParam, for: audience, q: search, page: page - 1, locale })}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:border-funding-green/40"
              >
                {t.prev}
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              {t.page(page, pages)}
            </span>
            {page < pages && (
              <Link
                href={catalogHref({ country: countryParam, for: audience, q: search, page: page + 1, locale })}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:border-funding-green/40"
              >
                {t.next}
              </Link>
            )}
          </nav>
        )}
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter locale={locale} />
      </div>
    </div>
  );
}
