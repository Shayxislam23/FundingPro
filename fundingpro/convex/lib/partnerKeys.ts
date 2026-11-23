/**
 * Partner API keys. Format: `fp_live_<43 base62 chars>` / `fp_test_<…>` (~256 bits).
 * Only the SHA-256 hash is stored. A high-entropy random key does not need a
 * slow hash or pepper; SHA-256 makes the lookup O(1) by index.
 * Uses Web Crypto so it runs in Convex, Node 18+ and the Edge runtime.
 */
export type PartnerKeyEnvironment = "production" | "sandbox";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEY_BODY_LENGTH = 43;

export function keyPrefixFor(env: PartnerKeyEnvironment): "fp_live_" | "fp_test_" {
  return env === "production" ? "fp_live_" : "fp_test_";
}

export function generatePartnerApiKey(env: PartnerKeyEnvironment): string {
  const bytes = new Uint8Array(KEY_BODY_LENGTH);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) {
    // 248 = 62 * 4 → rejection-free mapping would bias; re-draw values ≥ 248.
    let value = b;
    while (value >= 248) {
      const extra = new Uint8Array(1);
      crypto.getRandomValues(extra);
      value = extra[0];
    }
    body += ALPHABET[value % 62];
  }
  return `${keyPrefixFor(env)}${body}`;
}

export function isWellFormedPartnerKey(key: string): boolean {
  return /^fp_(live|test)_[0-9A-Za-z]{43}$/.test(key);
}

export function partnerKeyEnvironment(key: string): PartnerKeyEnvironment | null {
  if (key.startsWith("fp_live_")) return "production";
  if (key.startsWith("fp_test_")) return "sandbox";
  return null;
}

/** First 12 chars (`fp_live_AbCd`) — safe to display in admin UI for identification. */
export function displayPrefix(key: string): string {
  return key.slice(0, 12);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPartnerApiKey(key: string): Promise<string> {
  return sha256Hex(key);
}
