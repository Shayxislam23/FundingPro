import type { ConsentType, LegalDocId, LegalDocMeta, LegalDocumentContent, LegalLocale } from "./types";
import { LEGAL_EFFECTIVE_DATE } from "./types";
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

export const LEGAL_DOCUMENTS: LegalDocMeta[] = [
  {
    id: "offer",
    version: LEGAL_EFFECTIVE_DATE,
    path: "/legal/offer",
    titleRu: "Публичная оферта",
    titleUz: "Ommaviy oferta",
    consentType: "terms",
    required: true,
  },
  {
    id: "privacy",
    version: LEGAL_EFFECTIVE_DATE,
    path: "/legal/privacy",
    titleRu: "Политика конфиденциальности",
    titleUz: "Maxfiylik siyosati",
    consentType: "privacy",
    required: true,
  },
  {
    id: "refunds",
    version: LEGAL_EFFECTIVE_DATE,
    path: "/legal/refunds",
    titleRu: "Возврат средств",
    titleUz: "Pulni qaytarish",
    consentType: "payment_terms",
    required: false,
  },
  {
    id: "ai",
    version: LEGAL_EFFECTIVE_DATE,
    path: "/legal/ai",
    titleRu: "Обработка данных AI",
    titleUz: "AI ma'lumotlarini qayta ishlash",
    consentType: "ai_processing",
    required: false,
  },
  {
    id: "success-fee",
    version: LEGAL_EFFECTIVE_DATE,
    path: "/legal/success-fee",
    titleRu: "Гонорар за успех",
    titleUz: "Muvaffaqiyat mukofoti",
    required: false,
  },
];

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

export function getUsdUzsRate(): number {
  return Number(process.env.USD_UZS_RATE ?? "12800");
}

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
