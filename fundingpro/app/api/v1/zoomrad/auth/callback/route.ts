export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withPublic, withActiveUser } from "@/lib/api-route";
import {
  completePartnerAuthCallback,
  verifyPartnerSignedRequest,
} from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

async function parseBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Bank-server callback — requires partner HMAC (same as auth/init).
 * Does not accept a bare session token from the public internet.
 */
export const POST = withPublic(async (req) => {
  const rawBody = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400, "INVALID_JSON");
  }

  const channel = normalizePartnerSlug(typeof body.channel === "string" ? body.channel : "zoomrad");
  const verified = await verifyPartnerSignedRequest({
    channelSlug: channel,
    purpose: "auth",
    rawBody,
    signature: req.headers.get("x-partner-signature"),
    timestampHeader: req.headers.get("x-partner-timestamp"),
    nonceHeader: req.headers.get("x-partner-nonce"),
  });
  if (!verified.ok) {
    return apiError(verified.reason, 401, "PARTNER_AUTH_FAILED");
  }

  const sessionToken = String(body.sessionToken ?? "").trim();
  if (!sessionToken) {
    return apiError("sessionToken required", 400, "MISSING_FIELDS");
  }

  try {
    const result = await completePartnerAuthCallback({
      channel,
      sessionToken,
      externalUserId:
        typeof body.externalUserId === "string" ? body.externalUserId : undefined,
    });
    return apiSuccess(result);
  } catch (err) {
    console.error("POST /zoomrad/auth/callback error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});

/** Authenticated callback — links partner session to Clerk user inside mini app. */
export const PATCH = withActiveUser(async (req, authUser) => {
  const body = await parseBody(req);
  if (!body) return apiError("Invalid JSON body", 400, "INVALID_JSON");

  const sessionToken = String(body.sessionToken ?? "").trim();
  if (!sessionToken) {
    return apiError("sessionToken required", 400, "MISSING_FIELDS");
  }

  try {
    const result = await completePartnerAuthCallback({
      channel: normalizePartnerSlug(typeof body.channel === "string" ? body.channel : "zoomrad"),
      sessionToken,
      externalUserId:
        typeof body.externalUserId === "string" ? body.externalUserId : undefined,
      clerkUserId: authUser.userId,
      accessToken: authUser.accessToken,
    });
    return apiSuccess(result);
  } catch (err) {
    console.error("PATCH /zoomrad/auth/callback error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
