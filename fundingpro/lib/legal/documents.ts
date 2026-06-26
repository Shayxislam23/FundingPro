import type { ConsentType, LegalDocId, LegalDocMeta, LegalDocumentContent, LegalLocale } from "./types";
import { LEGAL_EFFECTIVE_DATE } from "./types";
import { LEGAL_DOCUMENTS } from "./meta";
import { getUsdUzsRate } from "./rates";
import { offerRu } from "./content/ru/offer";
import { privacyRu } from "./content/ru/privacy";
import { refundsRu } from "./content/ru/refunds";
import { aiRu } from "./content/ru/ai";
import { successFeeRu } from "./content/ru/success-fee";
import { offerUz } from "./content/uz/offer";
import { privacyUz } from "./content/uz/privacy";
import { refundsUz } from "./content/uz/refunds";
import { aiUz } from "./content/uz/ai";
import { successFeeUz } from "./content/uz/success-fee";

export { LEGAL_DOCUMENTS } from "./meta";
export { getUsdUzsRate } from "./rates";

const CONTENT: Record<LegalLocale, Record<LegalDocId, LegalDocumentContent>> = {
  ru: {
    offer: offerRu,
    privacy: privacyRu,
    refunds: refundsRu,
    ai: aiRu,
    "success-fee": successFeeRu,
  },
  uz: {
    offer: offerUz,
    privacy: privacyUz,
    refunds: refundsUz,
    ai: aiUz,
    "success-fee": successFeeUz,
  },
};

export function getLegalDocument(id: LegalDocId, locale: LegalLocale): LegalDocumentContent {
  return CONTENT[locale][id];
}

export function getLegalManifest() {
  return {
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    usdUzsRate: getUsdUzsRate(),
    documents: LEGAL_DOCUMENTS.map((d) => ({
      id: d.id,
      version: d.version,
      path: d.path,
      titleRu: d.titleRu,
      titleUz: d.titleUz,
      consentType: d.consentType ?? null,
      required: d.required,
    })),
    requiredConsents: ["terms", "privacy"] as ConsentType[],
  };
}

export function getConsentVersion(consentType: ConsentType): string {
  const doc = LEGAL_DOCUMENTS.find((d) => d.consentType === consentType);
  return doc?.version ?? LEGAL_EFFECTIVE_DATE;
}

export function getDocMeta(id: LegalDocId): LegalDocMeta {
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === id);
  if (!doc) throw new Error(`Unknown legal document: ${id}`);
  return doc;
}
