export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { createZoomradPayment } from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

export const POST = withActiveUser(async (req, authUser) => {
  try {
    const body = await req.json();
    const planId = String(body.planId ?? "").trim();
    const idempotencyKey = String(body.idempotencyKey ?? "").trim();
    if (!planId || !idempotencyKey) {
      return apiError("planId and idempotencyKey required", 400, "MISSING_FIELDS");
    }

    const user = await ensureInternalUser(
      { email: authUser.email, provider: "clerk" },
      authUser.accessToken
    );

    const channel = normalizePartnerSlug(typeof body.channel === "string" ? body.channel : "zoomrad");
    const serviceType = typeof body.serviceType === "string" ? body.serviceType : "subscription";
    const sessionToken =
      typeof body.sessionToken === "string" ? body.sessionToken : undefined;

    const payment = await createZoomradPayment({
      channel,
      userId: user.id,
      accessToken: authUser.accessToken,
      planId,
      serviceType,
      idempotencyKey,
      sessionToken,
    });

    await writeAuditLog({
      userId: authUser.userId,
      action: "zoomrad_payment_created",
      entityType: "payment",
      entityId: payment.paymentId,
      metadata: {
        channel,
        serviceType,
        partnerSharePercent: payment.partnerSharePercent,
        fundingProSharePercent: payment.fundingProSharePercent,
      },
    });

    return apiSuccess(payment, 201);
  } catch (err) {
    console.error("POST /zoomrad/payments/create error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
