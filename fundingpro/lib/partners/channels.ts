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
