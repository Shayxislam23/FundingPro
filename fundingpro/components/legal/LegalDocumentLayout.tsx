"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { LEGAL_DOCUMENTS } from "@/lib/legal/meta";
import type { LegalDocId, LegalLocale } from "@/lib/legal/types";
import { cn } from "@/lib/utils";

const DOC_IDS: LegalDocId[] = ["offer", "privacy", "refunds", "ai", "success-fee"];

export function LegalDocumentLayout({
  children,
  activeId,
}: {
  children: React.ReactNode;
  activeId: LegalDocId;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") === "uz" ? "uz" : "ru") as LegalLocale;

  function localeHref(id: LegalDocId) {
    const base = LEGAL_DOCUMENTS.find((d) => d.id === id)?.path ?? pathname;
    return `${base}?lang=${locale}`;
  }

  function switchLocale(next: LegalLocale) {
    return `${pathname}?lang=${next}`;
  }

  const activeMeta = LEGAL_DOCUMENTS.find((d) => d.id === activeId);

  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href={switchLocale("ru")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium",
                locale === "ru" ? "bg-funding-green text-white" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              RU
            </Link>
            <Link
              href={switchLocale("uz")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium",
                locale === "uz" ? "bg-funding-green text-white" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              UZ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        <nav className="flex flex-wrap gap-2 mb-8">
          {DOC_IDS.map((id) => {
            const meta = LEGAL_DOCUMENTS.find((d) => d.id === id);
            if (!meta) return null;
            const label = locale === "uz" ? meta.titleUz : meta.titleRu;
            return (
              <Link
                key={id}
                href={localeHref(id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  id === activeId
                    ? "bg-funding-green text-white border-funding-green"
                    : "bg-white text-gray-600 border-gray-200 hover:border-funding-green/40"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {activeMeta && (
          <p className="text-xs text-gray-400 mb-4">
            {locale === "uz" ? activeMeta.titleUz : activeMeta.titleRu}
          </p>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 shadow-sm">{children}</div>
      </div>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
