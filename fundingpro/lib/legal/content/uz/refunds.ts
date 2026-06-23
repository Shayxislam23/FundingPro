import type { LegalDocumentContent } from "../../types";
import { LEGAL_EFFECTIVE_DATE } from "../../types";
import { legalVars } from "../shared";

const v = legalVars();

export const refundsUz: LegalDocumentContent = {
  id: "refunds",
  locale: "uz",
  version: LEGAL_EFFECTIVE_DATE,
  title: "Pulni qaytarish siyosati",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      title: "1. Qaytarish shartlari",
      paragraphs: [
        "To'lovdan keyin 14 kalendar kun ichida so'rov mumkin, agar pullik AI funksiyalari ishlatilmagan bo'lsa.",
        `So'rov: ${v.email}. Ko'rib chiqish — 10 ish kuni. Qaytarish Uzum Bank orqali, tasdiqlangandan keyin 15 ish kungacha.`,
      ],
    },
    {
      title: "2. Istisnolar",
      paragraphs: [
        "Obuna to'liq ishlatilgan bo'lsa (AI limitlari, hujjatlar, arizalar), qaytarish qonunda nazarda tutilgan hollardan tashqari amalga oshirilmasligi mumkin.",
      ],
    },
  ],
};
