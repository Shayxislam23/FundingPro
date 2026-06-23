export const COMPANY = {
  legalNameRu: "ООО «FUNDINGPRO»",
  legalNameUz: '"FUNDINGPRO" MCHJ',
  legalNameFullUz: '"FUNDINGPRO" MAS\'ULIYATI CHEKLANGAN JAMIYAT',
  stir: "313 116 567",
  dguNumber: "61712",
  dguApplication: "DT 202602875",
  dguRegisteredAt: "2026-03-27",
  entityRegisteredAt: "2026-06-18",
  entityConfirmationNumber: "3174142",
  founder: "Shayxislam Seytibaev",
  founderUz: "Seytibaev Shayxislam Quatbay o'g'li",
  email: "info@fundingpro.uz",
  addressUz:
    "Qoraqalpog'iston Respublikasi, Kegeyli tumani, Xalqobod, Quyashli MFY, Miymandos ko'chasi, 26-uy",
  softwareTitle:
    "FundingPro – AI asosida grantlarni aniqlash, moslashtirish va boshqarish dasturiy platformasi",
  footerLine: "ООО «FUNDINGPRO», STIR 313 116 567, DGU No. 61712",
} as const;

export function getCompanyFooter(): string {
  return COMPANY.footerLine;
}

export function getCompanyHealthLabel(): string {
  return COMPANY.footerLine;
}
