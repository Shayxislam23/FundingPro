"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { getPartnerChannel, normalizePartnerSlug } from "@/lib/partners/channels";
import { cn } from "@/lib/utils";

const NAV_RU: { href: string; label: string }[] = [
  { href: "/zoomrad/welcome", label: "Главная" },
  { href: "/zoomrad/grants", label: "Гранты" },
  { href: "/zoomrad/eligibility", label: "Проверка" },
  { href: "/zoomrad/pricing", label: "Тарифы" },
  { href: "/zoomrad/support", label: "Поддержка" },
];

const NAV_UZ: { href: string; label: string }[] = [
  { href: "/zoomrad/welcome", label: "Bosh sahifa" },
  { href: "/zoomrad/grants", label: "Grantlar" },
  { href: "/zoomrad/eligibility", label: "Moslik" },
  { href: "/zoomrad/pricing", label: "Tariflar" },
  { href: "/zoomrad/support", label: "Yordam" },
];

const SESSION_STORAGE_KEY = "fp_zoomrad_session_token";

/** Deduplicate one-time launch exchanges across React Strict Mode remounts. */
const launchCodeExchanges = new Map<string, Promise<string>>();

type ZoomradShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function ZoomradShell({ children, title, subtitle }: ZoomradShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelSlug = normalizePartnerSlug(searchParams.get("channel"));
  const channel = getPartnerChannel(channelSlug);
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";
  const nav = locale === "uz" ? NAV_UZ : NAV_RU;
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  // Never propagate session/code on nav links — only channel + lang.
  const query = new URLSearchParams();
  query.set("channel", channelSlug);
  if (locale === "uz") query.set("lang", "uz");
  const q = query.toString();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || typeof window === "undefined") return;

    let alive = true;
    setExchanging(true);
    setExchangeError(null);

    let promise = launchCodeExchanges.get(code);
    if (!promise) {
      promise = (async () => {
        const res = await fetch("/api/v1/zoomrad/auth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, channel: channelSlug }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { sessionToken?: string };
          error?: { message?: string };
        };
        if (!res.ok || !json.data?.sessionToken) {
          throw new Error(json.error?.message ?? "Не удалось активировать сессию");
        }
        // Persist before any URL strip / remount so Strict Mode cleanup cannot drop the token.
        sessionStorage.setItem(SESSION_STORAGE_KEY, json.data.sessionToken);
        return json.data.sessionToken;
      })();
      launchCodeExchanges.set(code, promise);
    }

    void promise
      .then(() => {
        // Token is already in sessionStorage. Only strip ?code= while this mount is live —
        // navigating away mid-exchange must not yank the WebView back to the launch path.
        // Strict Mode remount attaches its own then via launchCodeExchanges.
        if (!alive) return;
        const next = new URLSearchParams(searchParams.toString());
        next.delete("code");
        next.delete("session");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      })
      .catch((err) => {
        launchCodeExchanges.delete(code);
        if (alive) {
          setExchangeError(err instanceof Error ? err.message : "Ошибка обмена кода");
        }
      })
      .finally(() => {
        if (alive) setExchanging(false);
      });

    return () => {
      alive = false;
    };
  }, [searchParams, channelSlug, pathname, router]);

  return (
    <div className="min-h-screen bg-[#F4FAF6] text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FundingProLogo className="h-7 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-neutral-500">
                {locale === "uz" ? "Mini ilova" : "Mini App"}
              </p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: channel?.primaryColor ?? "#008A2E" }}
          >
            {channel?.displayNameRu ?? "ZOOMRAD"}
          </span>
        </div>
        {title ? (
          <div className="border-t border-emerald-50 px-4 py-3">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {exchanging ? (
          <p className="mb-3 text-center text-sm text-neutral-600">
            {locale === "uz" ? "Sessiya ochilmoqda…" : "Открываем сессию…"}
          </p>
        ) : null}
        {exchangeError ? (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
            {exchangeError}
          </p>
        ) : null}
        {children}
      </main>

      <nav className="sticky bottom-0 border-t border-emerald-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2">
          {nav.map((item) => {
            const href = `${item.href}?${q}`;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "rounded-lg px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors",
                  active ? "bg-emerald-50 text-emerald-800" : "text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Read session token from sessionStorage after launch-code exchange. */
export function getZoomradSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}
