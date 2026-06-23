import type { LegalDocumentContent } from "../../types";
import { LEGAL_EFFECTIVE_DATE } from "../../types";
import { legalVars } from "../shared";

const v = legalVars();

export const offerUz: LegalDocumentContent = {
  id: "offer",
  locale: "uz",
  version: LEGAL_EFFECTIVE_DATE,
  title: "FundingPro xizmatlari bo'yicha ommaviy oferta",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      title: "1. Umumiy qoidalar",
      paragraphs: [
        `Ushbu hujjat ${v.companyUz} (STIR ${v.stir}, keyingi o'rinlarda — «Ijrochi») tomonidan O'zbekiston Respublikasining «Elektron tijorat to'g'risida»gi Qonuniga (O'RQ-792) muvofiq ommaviy oferta hisoblanadi.`,
        `Ofertani qabul qilish: ${v.appUrl} platformasida ro'yxatdan o'tish, shartlarga rozilik belgisini qo'yish va/yoki Uzum Bank orqali obunani to'lash.`,
        `Ijrochi axborot-konsultatsiya xizmatlarini SaaS formatida ko'rsatadi. Ijrochi bank, to'lov tashkiloti, kredit tashkiloti, mikromoliya tashkiloti emas va kredit, qarz yoki grant bermaydi.`,
      ],
    },
    {
      title: "2. Shartnoma predmeti",
      paragraphs: [
        "Ijrochi Foydalanuvchiga FundingPro platformasiga kirish huquqini beradi: xalqaro grantlarni qidirish, moslikni tekshirish, AI yordamida ariza loyihalarini tayyorlash, arizalar trekeri, hujjatlarni saqlash.",
        "Platforma grant olish, donor tasdig'i yoki aniq moliyaviy natijani kafolatlamaydi. AI materiallari qoralama hisoblanadi va topshirishdan oldin mutaxassis tekshiruvidan o'tishi kerak.",
      ],
    },
    {
      title: "3. Tariflar va to'lov",
      paragraphs: [
        `Xizmat narxi asosiy valyuta sifatida O'zbekiston so'mida (UZS) ko'rsatiladi. USD narxi ma'lumot uchun. Hisoblash: USD × ${v.rate} UZS to'lov sanasida.`,
        "To'lov Uzum Bank orqali amalga oshiriladi. Bank karta ma'lumotlarini Uzum Bank qayta ishlaydi; Ijrochi karta rekvizitlarini saqlamaydi.",
        "Obuna faollashtirilgan kundan boshlab 1 (bir) kalendar oy davom etadi. Avtomatik uzaytirish alohida yoqilmaguncha qo'llanilmaydi.",
      ],
    },
    {
      title: "4. Pulni qaytarish va muvaffaqiyat mukofoti",
      paragraphs: [
        "Pulni qaytarish shartlari /legal/refunds sahifasida. Muvaffaqiyat mukofoti (2–5%) faqat alohida yozma shartnoma bo'lganda — /legal/success-fee.",
      ],
    },
    {
      title: "5. Ijrochi rekvizitlari",
      paragraphs: [
        `${v.companyUz}, STIR ${v.stir}`,
        `Manzil: ${v.address}`,
        `Email: ${v.email}`,
        `DT ro'yxati: DGU № ${v.dgu}`,
      ],
    },
  ],
};
