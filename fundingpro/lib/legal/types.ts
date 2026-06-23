export type LegalDocId = "offer" | "privacy" | "refunds" | "ai" | "success-fee";

export const LEGAL_EFFECTIVE_DATE = "2026-06-01";

export type LegalLocale = "ru" | "uz";

export type ConsentType = "terms" | "privacy" | "ai_processing" | "payment_terms";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocumentContent = {
  id: LegalDocId;
  locale: LegalLocale;
  version: string;
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export type LegalDocMeta = {
  id: LegalDocId;
  version: string;
  path: string;
  titleRu: string;
  titleUz: string;
  consentType?: ConsentType;
  required: boolean;
};
