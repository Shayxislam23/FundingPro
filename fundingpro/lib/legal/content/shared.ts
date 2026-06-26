import { COMPANY } from "@/lib/company-info";
import { getUsdUzsRate } from "../rates";

export function legalVars() {
  const rate = getUsdUzsRate();
  const appUrl =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz")
      : "https://fundingpro.uz";
  return {
    companyRu: COMPANY.legalNameRu,
    companyUz: COMPANY.legalNameUz,
    stir: COMPANY.stir,
    email: COMPANY.email,
    address: COMPANY.addressUz,
    dgu: COMPANY.dguNumber,
    rate: rate.toLocaleString("ru-RU"),
    appUrl,
  };
}
