const AUTH_CALLBACK_PATH = /^fundingpro:\/\/auth\/callback\/?$/i;
const JWT_PART = /^[A-Za-z0-9_-]+$/;
const TOKEN_HASH = /^[A-Za-z0-9_-]{16,256}$/;
const OTP_TYPES = new Set(["recovery", "email", "signup", "invite", "magiclink", "email_change"]);

export function isValidAuthCallbackUrl(url: string): boolean {
  try {
    const base = url.split("#")[0]?.split("?")[0] ?? "";
    return AUTH_CALLBACK_PATH.test(base);
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

  const query = url.includes("?") ? url.split("?")[1]?.split("#")[0] : undefined;
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
