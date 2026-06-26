import type { LegalDocMeta } from "./types";
import { LEGAL_EFFECTIVE_DATE } from "./types";

/** Navigation metadata only — safe to import from client components. */
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
