"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";

type Props = {
  locale: Locale;
  /** Path without the lang parameter, e.g. "/grants?for=business". */
  path: string;
  tone?: "dark" | "light";
};

function setLocaleCookie(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies disabled — the ?lang parameter still works
  }
}

function hrefFor(path: string, locale: Locale): string {
  const url = new URL(path, "https://x.local");
  url.searchParams.delete("lang");
  url.searchParams.set("lang", locale);
  return `${url.pathname}${url.search}`;
}

/** RU | O‘Z toggle. Remembers the choice in a cookie so other pages follow it. */
export function LanguageSwitcher({ locale, path, tone = "light" }: Props) {
  useEffect(() => {
    setLocaleCookie(locale);
  }, [locale]);

  const base = "px-2 py-1 rounded-lg text-xs font-semibold transition-colors";
  const active = tone === "dark" ? "bg-white/15 text-white" : "bg-funding-light-green text-funding-green";
  const idle = tone === "dark" ? "text-[#A7B8AA] hover:text-white" : "text-gray-500 hover:text-funding-green";

  return (
    <div className="inline-flex items-center gap-0.5" aria-label="Language">
      {(["ru", "uz"] as const).map((l) => (
        <Link
          key={l}
          href={hrefFor(path, l)}
          hrefLang={l}
          onClick={() => setLocaleCookie(l)}
          className={`${base} ${locale === l ? active : idle}`}
          aria-current={locale === l ? "true" : undefined}
        >
          {l === "ru" ? "RU" : "O‘Z"}
        </Link>
      ))}
    </div>
  );
}
