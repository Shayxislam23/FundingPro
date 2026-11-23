/** Public-site locales. Russian is the default; Uzbek (Latin) via ?lang=uz or the fp_lang cookie. */
export type Locale = "ru" | "uz";

export const LOCALE_COOKIE = "fp_lang";
export const LOCALES: readonly Locale[] = ["ru", "uz"] as const;

export function isLocale(value: unknown): value is Locale {
  return value === "ru" || value === "uz";
}

/** Query parameter wins (shareable links, hreflang), then the remembered cookie, then Russian. */
export function resolveLocale(queryLang: string | string[] | undefined | null, cookieLang?: string | null): Locale {
  const q = Array.isArray(queryLang) ? queryLang[0] : queryLang;
  if (isLocale(q)) return q;
  if (isLocale(cookieLang)) return cookieLang;
  return "ru";
}

/** Adds `lang=uz` to an internal href when the page is Uzbek (Russian URLs stay clean). */
export function withLang(href: string, locale: Locale): string {
  if (locale === "ru") return href;
  const [path, hash] = href.split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=uz${hash ? `#${hash}` : ""}`;
}
