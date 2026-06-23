import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { getLegalDocument } from "@/lib/legal/documents";
import type { LegalLocale } from "@/lib/legal/types";

type PageProps = { searchParams: { lang?: string } };

export default function LegalAiPage({ searchParams }: PageProps) {
  const locale = (searchParams.lang === "uz" ? "uz" : "ru") as LegalLocale;
  const doc = getLegalDocument("ai", locale);
  return (
    <LegalDocumentLayout activeId="ai">
      <LegalDocument document={doc} />
    </LegalDocumentLayout>
  );
}
