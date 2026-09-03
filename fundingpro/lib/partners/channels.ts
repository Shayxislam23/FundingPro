import type { PartnerChannelConfig, PartnerChannelSlug } from "./types";

/** Registered distribution channels — extend for future bank mini apps. */
export const PARTNER_CHANNELS: Record<string, PartnerChannelConfig> = {
  zoomrad: {
    slug: "zoomrad",
    displayNameRu: "ZOOMRAD",
    displayNameUz: "ZOOMRAD",
    webViewPath: "/zoomrad",
    authMode: "partner_sso",
    primaryColor: "#008A2E",
    badgeLabelRu: "Mini App",
    badgeLabelUz: "Mini ilova",
    isActive: true,
  },
};

export function getPartnerChannel(slug: string): PartnerChannelConfig | null {
  const channel = PARTNER_CHANNELS[slug];
  if (!channel || !channel.isActive) return null;
  return channel;
}

export function listActivePartnerChannels(): PartnerChannelConfig[] {
  return Object.values(PARTNER_CHANNELS).filter((c) => c.isActive);
}

export function partnerLaunchUrl(
  channel: PartnerChannelConfig,
  siteOrigin: string,
  path = "/welcome"
): string {
  const base = siteOrigin.replace(/\/$/, "");
  return `${base}${channel.webViewPath}${path}?channel=${encodeURIComponent(channel.slug)}`;
}

export function normalizePartnerSlug(value: string | null | undefined): PartnerChannelSlug {
  const slug = (value ?? "zoomrad").trim().toLowerCase();
  return (getPartnerChannel(slug)?.slug ?? "zoomrad") as PartnerChannelSlug;
}

/** Query keys safe to put on links / auth redirects (never code/session secrets). */
const PARTNER_SAFE_QUERY_KEYS = ["channel", "lang", "planId", "plan"] as const;

/**
 * Build `?channel=…&lang=…` (etc.) for Zoomrad CTAs — strips one-time `code` / session bearers.
 */
export function partnerSafeQueryString(
  searchParams: Pick<URLSearchParams, "get">,
  extra?: Record<string, string | null | undefined>
): string {
  const out = new URLSearchParams();
  for (const key of PARTNER_SAFE_QUERY_KEYS) {
    const v = searchParams.get(key);
    if (v) out.set(key, v);
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) out.set(key, value);
      else out.delete(key);
    }
  }
  const s = out.toString();
  return s ? `?${s}` : "";
}
