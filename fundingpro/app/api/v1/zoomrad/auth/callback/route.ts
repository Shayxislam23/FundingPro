export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withPublic, withActiveUser } from "@/lib/api-route";
import { completePartnerAuthCallback } from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

async function parseBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Public callback for bank server or WebView bootstrap. */
export const POST = withPublic(async (req) => {
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
