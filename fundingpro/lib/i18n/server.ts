import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./locale";

/** Locale for a server-rendered public page. */
export async function getPageLocale(queryLang: string | string[] | undefined): Promise<Locale> {
  let cookieLang: string | undefined;
  try {
    cookieLang = (await cookies()).get(LOCALE_COOKIE)?.value;
  } catch {
    cookieLang = undefined;
  }
  return resolveLocale(queryLang, cookieLang);
}
