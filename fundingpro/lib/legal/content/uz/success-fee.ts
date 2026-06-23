import type { LegalDocumentContent } from "../../types";
import { LEGAL_EFFECTIVE_DATE } from "../../types";
import { legalVars } from "../shared";

const v = legalVars();

export const successFeeUz: LegalDocumentContent = {
  id: "success-fee",
  locale: "uz",
  version: LEGAL_EFFECTIVE_DATE,
  title: "Muvaffaqiyat mukofoti shartlari",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      title: "1. Umumiy qoidalar",
      paragraphs: [
        "Muvaffaqiyat mukofoti — grant olinganda konsultatsiya xizmati uchun qo'shimcha mukofot. Kredit foizi yoki moliyaviy xizmat emas.",
        "2–5% miqdori alohida yozma shartnomada belgilanadi. Grant mablag'laridan avtomatik ushlab qolish alohida shartnomasiz amalga oshirilmaydi.",
        `Savollar: ${v.email}`,
      ],
    },
  ],
};
