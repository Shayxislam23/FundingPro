import Link from "next/link";
import { notFound } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";
import { getPublicGrantById } from "@/lib/public-grants";
import { formatGrantAmount, formatDeadlineDate } from "@fundingpro/shared";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ channel?: string; lang?: string; session?: string }>;
};

export default async function ZoomradGrantDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const grant = await getPublicGrantById(id);
  if (!grant) notFound();

  const locale = sp.lang === "uz" ? "uz" : "ru";
  const q = new URLSearchParams();
  if (sp.channel) q.set("channel", sp.channel);
  if (sp.lang) q.set("lang", sp.lang);
  if (sp.session) q.set("session", sp.session);
  const suffix = q.toString() ? `?${q.toString()}` : "";

  return (
    <ZoomradShell title={grant.title_ru ?? grant.title}>
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-neutral-600">{grant.donor.name_ru ?? grant.donor.name}</p>
        <p className="text-sm leading-relaxed text-neutral-800">
          {grant.description_ru ?? grant.description ?? "—"}
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutral-500">{locale === "uz" ? "Summa" : "Сумма"}</dt>
            <dd className="font-medium">{formatGrantAmount(grant.amount_min, grant.amount_max)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{locale === "uz" ? "Muddat" : "Дедлайн"}</dt>
            <dd className="font-medium">
              {grant.deadline ? formatDeadlineDate(grant.deadline) : "—"}
            </dd>
          </div>
        </dl>
        <Link
          href={`/zoomrad/eligibility${suffix}`}
          className="block rounded-xl bg-[#008A2E] px-4 py-3 text-center text-sm font-semibold text-white"
        >
          {locale === "uz" ? "Moslikni tekshirish" : "Проверить соответствие"}
        </Link>
      </div>
    </ZoomradShell>
  );
}
