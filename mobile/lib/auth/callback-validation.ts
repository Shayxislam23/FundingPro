const AUTH_CALLBACK_SCHEME = /^fundingpro:\/\/auth\/callback\/?$/i;
const AUTH_CALLBACK_HTTPS = /^https:\/\/(www\.)?fundingpro\.uz\/mobile\/auth\/callback\/?$/i;

const SUBSCRIPTION_RETURN_SCHEME = /^fundingpro:\/\/subscription\/return\/?$/i;
const SUBSCRIPTION_RETURN_HTTPS =
  /^https:\/\/(www\.)?fundingpro\.uz\/mobile\/subscription\/return\/?$/i;

const JWT_PART = /^[A-Za-z0-9_-]+$/;
const TOKEN_HASH = /^[A-Za-z0-9_-]{16,256}$/;
const PAYMENT_ID = /^[a-zA-Z0-9_-]{8,128}$/;
const OTP_TYPES = new Set(["recovery", "email", "signup", "invite", "magiclink", "email_change"]);

function basePath(url: string): string {
  return url.split("#")[0]?.split("?")[0] ?? "";
}

function queryString(url: string): string | undefined {
  if (!url.includes("?")) return undefined;
  return url.split("?").slice(1).join("?").split("#")[0];
}

export function isValidAuthCallbackUrl(url: string): boolean {
  try {
    const base = basePath(url);
    return AUTH_CALLBACK_SCHEME.test(base) || AUTH_CALLBACK_HTTPS.test(base);
  } catch {
    return false;
  }
}

export function isValidSubscriptionReturnUrl(url: string): boolean {
  try {
    const base = basePath(url);
    return SUBSCRIPTION_RETURN_SCHEME.test(base) || SUBSCRIPTION_RETURN_HTTPS.test(base);
  } catch {
    return false;
  }
}

export function isPlausibleJwt(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  return parts.every((part) => part.length > 0 && part.length < 4096 && JWT_PART.test(part));
}

type OtpType = "recovery" | "email" | "signup" | "invite" | "magiclink" | "email_change";

export type AuthCallbackPayload =
  | { kind: "session"; access_token: string; refresh_token: string }
  | { kind: "otp"; token_hash: string; type: OtpType };

/**
 * @deprecated Supabase-era hash/query token parser. Live deep links use Clerk
 * `handleRedirectCallback` + `isValidAuthCallbackUrl` only (see deep-link.ts).
 * Kept for MSTG docs / mirrored unit tests in fundingpro/tests — do not wire
 * into production auth flows.
 */
export function parseAuthCallbackUrl(url: string): AuthCallbackPayload | null {
  if (!isValidAuthCallbackUrl(url)) return null;

  const hash = url.split("#")[1];
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token && isPlausibleJwt(access_token) && isPlausibleJwt(refresh_token)) {
      return { kind: "session", access_token, refresh_token };
    }
  }

  const query = queryString(url);
  if (query) {
    const params = new URLSearchParams(query);
    const token_hash = params.get("token_hash") ?? "";
    const type = params.get("type") ?? "recovery";
    if (TOKEN_HASH.test(token_hash) && OTP_TYPES.has(type)) {
      return { kind: "otp", token_hash, type: type as OtpType };
    }
  }

  return null;
}

export function parseSubscriptionReturnUrl(url: string): { paymentId: string } | null {
  if (!isValidSubscriptionReturnUrl(url)) return null;

  const query = queryString(url);
  if (!query) return null;

  const paymentId = new URLSearchParams(query).get("paymentId") ?? "";
  if (!isPlausiblePaymentId(paymentId)) return null;

  return { paymentId };
}

export function isPlausiblePaymentId(paymentId: string): boolean {
  return PAYMENT_ID.test(paymentId);
}
