import { COMPANY } from "@/lib/company-info";
import { getUsdUzsRate } from "../documents";

export function legalVars() {
  const rate = getUsdUzsRate();
  return {
    companyRu: COMPANY.legalNameRu,
    companyUz: COMPANY.legalNameUz,
    stir: COMPANY.stir,
    email: COMPANY.email,
    address: COMPANY.addressUz,
    dgu: COMPANY.dguNumber,
    rate: rate.toLocaleString("ru-RU"),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz",
  };
}
