/**
 * True when Clerk env looks like a real Dashboard key (not template / CI placeholders).
 * Used to show setup hints and avoid promising demo login when auth cannot succeed.
 */
export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  if (!pk.startsWith("pk_") || !sk.startsWith("sk_")) return false;
  if (pk.includes("...") || sk.includes("...")) return false;
  if (pk.includes("your-") || sk.includes("your-")) return false;
  // CI / docs placeholders (base64 of foo-bar-13… / clerk.dev$test$)
  if (pk.includes("Zm9vLWJhci") || sk.includes("Y2xlcmsuZGV2")) return false;
  return true;
}

/** Client-safe: only checks publishable key shape (secret is never exposed). */
export function isClerkPublishableConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!pk.startsWith("pk_")) return false;
  if (pk.includes("...") || pk.includes("your-") || pk.includes("Zm9vLWJhci")) return false;
  return true;
}
