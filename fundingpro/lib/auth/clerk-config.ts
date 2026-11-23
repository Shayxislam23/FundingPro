/**
 * True when Clerk env looks like a real Dashboard key (not template / CI placeholders).
 * Used to show setup hints and avoid promising demo login when auth cannot succeed.
 */
function looksLikePlaceholderKey(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  const lower = v.toLowerCase();
  return (
    v.includes("...") ||
    lower.includes("your-") ||
    lower.includes("replace_me") ||
    lower.includes("placeholder") ||
    lower.includes("changeme") ||
    v.includes("Zm9vLWJhci") || // CI docs base64 placeholder
    v.includes("Y2xlcmsuZGV2") // clerk.dev$test$
  );
}

export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  if (!pk.startsWith("pk_") || !sk.startsWith("sk_")) return false;
  if (looksLikePlaceholderKey(pk) || looksLikePlaceholderKey(sk)) return false;
  // Real Clerk keys are longer than template stubs like pk_test_REPLACE_ME
  if (pk.length < 40 || sk.length < 40) return false;
  return true;
}

/** Client-safe: only checks publishable key shape (secret is never exposed). */
export function isClerkPublishableConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!pk.startsWith("pk_")) return false;
  if (looksLikePlaceholderKey(pk)) return false;
  if (pk.length < 40) return false;
  return true;
}
