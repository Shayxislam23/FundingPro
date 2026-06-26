import type { LegalDocumentContent } from "../../types";
import { LEGAL_EFFECTIVE_DATE } from "../../types";
import { legalVars } from "../shared";

const v = legalVars();

export const privacyUz: LegalDocumentContent = {
  id: "privacy",
  locale: "uz",
  version: LEGAL_EFFECTIVE_DATE,
  title: "Shaxsiy ma'lumotlarni qayta ishlash siyosati",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      title: "1. Operator",
      paragraphs: [
        `Operator: ${v.companyUz}, STIR ${v.stir}, manzil: ${v.address}, email: ${v.email}.`,
        "Siyosat O'RQ-547 va O'RQ-1125 (2026) ga muvofiq ishlab chiqilgan.",
      ],
    },
    {
      title: "2. Ma'lumotlar toifalari va maqsadlar",
      paragraphs: [
        "Email, hisob ma'lumotlari, tashkilot profili, yuklangan hujjatlar, AI jurnallari, to'lov metama'lumotlari (karta raqamlarisiz), texnik ma'lumotlar.",
        "Maqsadlar: ro'yxatdan o'tish, platformadan foydalanish, obuna va to'lovlar, AI funksiyalari, qo'llab-quvvatlash, qonunchilikka rioya.",
      ],
    },
    {
      title: "3. Uchinchi shaxslar va transchegaraviy uzatish",
      paragraphs: [
        "Ma'lumotlar Convex (DB), Clerk (auth), Vercel, Resend, Uzum Bank, OpenAI/Anthropic (tashqi AI yoqilganda) da qayta ishlanishi mumkin.",
        "Transchegaraviy uzatish Foydalanuvchi roziligi va/yoki shartnoma asosida amalga oshiriladi.",
      ],
    },
    {
      title: "4. Subyekt huquqlari",
      paragraphs: [
        `So'rovlar ${v.email} ga yuboriladi. Javob muddati — 10 ish kunigacha.`,
      ],
    },
  ],
};
