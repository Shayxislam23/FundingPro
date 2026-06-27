import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { getLegalDocument } from "@/lib/legal/documents";
import type { LegalLocale } from "@/lib/legal/types";

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function LegalPrivacyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = (sp.lang === "uz" ? "uz" : "ru") as LegalLocale;
  const doc = getLegalDocument("privacy", locale);
  return (
    <LegalDocumentLayout activeId="privacy">
      <LegalDocument document={doc} />
    </LegalDocumentLayout>
  );
}
