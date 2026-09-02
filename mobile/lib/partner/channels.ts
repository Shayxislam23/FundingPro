/** Partner channel registry for native app WebView shells (ZOOMRAD + future banks). */
export type PartnerChannelSlug = "zoomrad" | (string & {});

export interface MobilePartnerChannel {
  slug: PartnerChannelSlug;
  displayName: string;
  webPath: string;
  primaryColor: string;
  badgeLabel: string;
}

export const MOBILE_PARTNER_CHANNELS: Record<string, MobilePartnerChannel> = {
  zoomrad: {
    slug: "zoomrad",
    displayName: "ZOOMRAD",
    webPath: "/zoomrad/welcome",
    primaryColor: "#008A2E",
    badgeLabel: "Mini App",
  },
};

export function getMobilePartnerChannel(slug: string): MobilePartnerChannel | null {
  return MOBILE_PARTNER_CHANNELS[slug.toLowerCase()] ?? null;
}

export function buildPartnerWebViewUrl(
  apiBaseWithoutVersion: string,
  channel: MobilePartnerChannel,
  params?: { lang?: "ru" | "uz"; session?: string }
): string {
  const site = apiBaseWithoutVersion.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  const url = new URL(`${site}${channel.webPath}`);
  url.searchParams.set("channel", channel.slug);
  if (params?.lang) url.searchParams.set("lang", params.lang);
  if (params?.session) url.searchParams.set("session", params.session);
  return url.toString();
}
