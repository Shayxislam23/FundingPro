import type { LegalDocumentContent } from "../../types";
import { LEGAL_EFFECTIVE_DATE } from "../../types";
import { legalVars } from "../shared";

const v = legalVars();

export const aiUz: LegalDocumentContent = {
  id: "ai",
  locale: "uz",
  version: LEGAL_EFFECTIVE_DATE,
  title: "AI yordamida ma'lumotlarni qayta ishlashga rozilik",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      title: "1. Rozilik predmeti",
      paragraphs: [
        "Foydalanuvchi kiritilgan ma'lumotlarni AI algoritmlari yordamida tavsiyalar va qoralamalar yaratish uchun qayta ishlashga rozilik beradi.",
      ],
    },
    {
      title: "2. Provayderlar va cheklovlar",
      paragraphs: [
        "Qayta ishlash FundingPro serverlarida yoki OpenAI/Anthropic kabi tashqi provayderlarda bo'lishi mumkin; ma'lumotlar O'zbekiston chetiga uzatilishi mumkin.",
        "Email, telefon, JSHSHIR, pasport va FIO avtomatik yashiriladi. Natija huquqiy kafolat emas.",
        `Rozilikni bekor qilish: ${v.email}`,
      ],
    },
  ],
};
