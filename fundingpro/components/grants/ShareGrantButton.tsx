"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type ShareGrantButtonProps = {
  grantId: string;
  title: string;
};

export function ShareGrantButton({ grantId, title }: ShareGrantButtonProps) {
  const [copied, setCopied] = useState(false);

  function buildShareUrl(): string {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    const url = new URL(`/grants/${grantId}`, base);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "social");
    return url.toString();
  }

  async function handleShare() {
    const shareUrl = buildShareUrl();
    trackEvent("grant_shared", { grant_id: grantId });

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-funding-green/40 hover:text-funding-green transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-funding-green" />
          Ссылка скопирована
        </>
      ) : typeof navigator !== "undefined" && "share" in navigator ? (
        <>
          <Share2 className="w-4 h-4" />
          Поделиться
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4" />
          Скопировать ссылку
        </>
      )}
    </button>
  );
}
