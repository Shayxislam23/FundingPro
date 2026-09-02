import crypto from "crypto";

export function hashPartnerToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPartnerSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyPartnerWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function partnerAuthSecretForChannel(channelSlug: string): string | null {
  if (channelSlug === "zoomrad") {
    return process.env.ZOOMRAD_AUTH_SECRET ?? process.env.ZOOMRAD_WEBHOOK_SECRET ?? null;
  }
  const envKey = `${channelSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_AUTH_SECRET`;
  return process.env[envKey] ?? null;
}

export function partnerWebhookSecretForChannel(channelSlug: string): string | null {
  if (channelSlug === "zoomrad") {
    return process.env.ZOOMRAD_WEBHOOK_SECRET ?? null;
  }
  const envKey = `${channelSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_WEBHOOK_SECRET`;
  return process.env[envKey] ?? null;
}
