export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import {
  initPartnerAuth,
  verifyPartnerSignedRequest,
} from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

export const POST = withPublic(async (req: NextRequest) => {
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

  const externalUserId = String(body.externalUserId ?? "").trim();
  if (!externalUserId) {
    return apiError("externalUserId required", 400, "MISSING_FIELDS");
  }

  try {
    const result = await initPartnerAuth({
      channel,
      externalUserId,
      displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      locale: body.locale === "uz" ? "uz" : "ru",
      returnPath: typeof body.returnPath === "string" ? body.returnPath : undefined,
    });
    return apiSuccess(result, 201);
  } catch (err) {
    console.error("POST /zoomrad/auth/init error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
