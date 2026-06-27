import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { ShareGrantButton } from "@/components/grants/ShareGrantButton";
import { getPublicGrantById } from "@/lib/public-grants";
import { formatGrantAmount, formatDeadlineDate } from "@fundingpro/shared";
import { translateSector } from "@fundingpro/shared";
import {
  absoluteUrl,
  defaultOgImageUrl,
  defaultOgImages,
  hreflangAlternates,
  openGraphPage,
} from "@/lib/seo/site";
import { ArrowLeft, Calendar, MapPin, DollarSign, ExternalLink } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const grant = await getPublicGrantById(id);
    if (!grant) return { title: "Грант не найден" };

    const title = grant.title_ru ?? grant.title;
    const description =
      (grant.description_ru ?? grant.description)?.slice(0, 160) ??
      `Грант от ${grant.donor.name_ru ?? grant.donor.name}`;

    const grantPath = `/grants/${id}`;

    return {
      title,
      description,
      alternates: hreflangAlternates(grantPath),
      openGraph: {
        ...openGraphPage(title, description, grantPath),
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [defaultOgImageUrl],
      },
    };
  } catch {
    return { title: "Грант не найден" };
  }
}

export default async function PublicGrantDetailPage({ params }: PageProps) {
  const { id } = await params;
  let grant: Awaited<ReturnType<typeof getPublicGrantById>> = null;

  try {
    grant = await getPublicGrantById(id);
  } catch {
    notFound();
  }

  if (!grant) notFound();

  const title = grant.title_ru ?? grant.title;
  const description = grant.description_ru ?? grant.description;
  const donorName = grant.donor.name_ru ?? grant.donor.name;
  const amount = formatGrantAmount(grant.amount_min, grant.amount_max);
  const deadline = formatDeadlineDate(grant.deadline);
  const sectors = grant.sectors.map(translateSector);
  const countries = grant.country_scope.join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description ?? undefined,
    author: {
      "@type": "Organization",
      name: donorName,
      url: grant.donor.website ?? undefined,
    },
    dateModified: grant.deadline ?? undefined,
    mainEntityOfPage: absoluteUrl(`/grants/${grant.id}`),
  };

  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <ShareGrantButton grantId={grant.id} title={title} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1">
        <Link
          href="/grants"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-funding-green mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          К каталогу грантов
        </Link>

        <article className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 shadow-sm">
          <p className="text-sm font-semibold text-funding-green mb-2">{donorName}</p>
          <h1 className="text-2xl md:text-3xl font-black text-funding-black mb-6 leading-tight">
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-100">
            {amount && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-funding-green" />
                {amount}
              </span>
            )}
            {deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-funding-green" />
                Дедлайн: {deadline}
              </span>
            )}
            {countries && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-funding-green" />
                {countries}
              </span>
            )}
          </div>

          {description && (
            <div className="prose prose-sm max-w-none mb-8">
              <h2 className="text-lg font-semibold text-funding-black mb-3">Описание</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {sectors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-funding-black mb-3">Секторы</h2>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full bg-funding-light-green text-funding-green font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(grant.grant_requirements?.length ?? 0) > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-funding-black mb-3">Требования</h2>
              <ul className="space-y-2">
                {(grant.grant_requirements ?? []).map((req) => (
                  <li key={req.id} className="flex items-start gap-2 text-sm text-gray-600">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${req.required ? "bg-funding-green" : "bg-gray-300"}`}
                    />
                    {req.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: "#008A2E" }}
            >
              Подать заявку через FundingPro
            </Link>
            {grant.donor.website && (
              <a
                href={grant.donor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-funding-green/40"
              >
                Сайт донора <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </article>
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
