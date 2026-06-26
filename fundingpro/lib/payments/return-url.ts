import { getUzumCheckoutConfig } from "./config";

const MOBILE_CHECKOUT_RETURN = "fundingpro://subscription/return";

const ALLOWED_WEB_HOSTS = new Set([
  "fundingpro.uz",
  "www.fundingpro.uz",
  "localhost",
  "127.0.0.1",
]);

/**
 * Server-side checkout return URL. Client-supplied returnUrl is never trusted.
 */
export function resolveCheckoutReturnUrl(platform?: string): string {
  if (platform === "mobile") {
    return MOBILE_CHECKOUT_RETURN;
  }

  const configured = getUzumCheckoutConfig().returnUrl;
  if (isAllowedCheckoutReturnUrl(configured)) {
    return stripQueryAndHash(configured);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/dashboard/subscription/return`;
}

export function isAllowedCheckoutReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "fundingpro:") {
      return parsed.hostname === "subscription" && parsed.pathname === "/return";
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_WEB_HOSTS.has(host)) {
      return false;
    }
    return parsed.pathname.startsWith("/dashboard/subscription");
  } catch {
    return false;
  }
}

function stripQueryAndHash(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "") || url;
}

export { MOBILE_CHECKOUT_RETURN };
