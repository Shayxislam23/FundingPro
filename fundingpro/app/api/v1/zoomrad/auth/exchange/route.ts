export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { exchangePartnerLaunchCode } from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

/** Exchange one-time WebView launch code for a session token (store in sessionStorage). */
export const POST = withPublic(async (req) => {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400, "INVALID_JSON");
  }

  const launchCode = String(body.code ?? body.launchCode ?? "").trim();
  if (!launchCode) {
    return apiError("code required", 400, "MISSING_FIELDS");
  }

  try {
    const result = await exchangePartnerLaunchCode({
      channel: normalizePartnerSlug(typeof body.channel === "string" ? body.channel : "zoomrad"),
      launchCode,
    });
    return apiSuccess(result);
  } catch (err) {
    console.error("POST /zoomrad/auth/exchange error:", err);
    return apiError(err instanceof Error ? err.message : "Invalid or expired code", 400, "INVALID_CODE");
  }
});
