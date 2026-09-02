"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GrantCard } from "@/components/design/GrantCard";
import { EmptyState } from "@/components/design/EmptyState";
import { ZoomradShell } from "@/components/partners/ZoomradShell";
import type { GrantListItem } from "@/lib/public-grants";
import { formatGrantAmount, formatDeadlineDate, getDeadlineUrgency } from "@fundingpro/shared";
import { translateSector } from "@fundingpro/shared";

type ZoomradGrantsClientProps = {
  initialGrants: GrantListItem[];
  searchParams: { channel?: string; lang?: string; session?: string };
};

export function ZoomradGrantsClient({ initialGrants, searchParams }: ZoomradGrantsClientProps) {
  const locale = searchParams.lang === "uz" ? "uz" : "ru";
  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (searchParams.channel) q.set("channel", searchParams.channel);
    if (searchParams.lang) q.set("lang", searchParams.lang);
    if (searchParams.session) q.set("session", searchParams.session);
    return q.toString();
  }, [searchParams]);
  const suffix = query ? `?${query}` : "";

  return (
    <ZoomradShell
      title={locale === "uz" ? "Grantlar katalogi" : "Каталог грантов"}
      subtitle={
        locale === "uz"
          ? "O‘zbekiston uchun xalqaro grantlar va imkoniyatlar"
          : "Международные гранты и возможности для Узбекистана"
      }
    >
      {initialGrants.length === 0 ? (
        <EmptyState
          title={locale === "uz" ? "Grantlar hozircha yo‘q" : "Гранты пока недоступны"}
          description={
            locale === "uz"
              ? "Katalog yangilanmoqda. Keyinroq qayta urinib ko‘ring."
              : "Каталог обновляется. Попробуйте позже."
          }
        />
      ) : (
        <div className="space-y-3">
          {initialGrants.map((grant) => (
            <Link key={grant.id} href={`/zoomrad/grants/${grant.id}${suffix}`} className="block">
              <GrantCard
                id={grant.id}
                title={grant.title_ru ?? grant.title}
                donor={grant.donor.name_ru ?? grant.donor.name ?? "—"}
                amount={formatGrantAmount(grant.amount_min, grant.amount_max)}
                deadline={grant.deadline ? formatDeadlineDate(grant.deadline) : undefined}
                deadlineUrgency={grant.deadline ? getDeadlineUrgency(grant.deadline) : null}
                country={grant.country_scope[0]}
                sector={grant.sectors[0] ? translateSector(grant.sectors[0]) : undefined}
                variant="light"
              />
            </Link>
          ))}
        </div>
      )}
    </ZoomradShell>
  );
}
