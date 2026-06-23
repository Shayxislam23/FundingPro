export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { assertPaymentConsents, recordConsents } from "@/lib/db/consents";
import { ensureInternalUser } from "@/lib/db/users";
import { createSubscriptionPaymentIntent, isPaymentsEnabled } from "@/lib/payments";
import { getConsentVersion } from "@/lib/legal/documents";

export const POST = withActiveUser(async (req, authUser) => {
  if (!isPaymentsEnabled()) {
    return apiError("Payments are not enabled", 503, "PAYMENTS_DISABLED");
  }

  try {
    const body = await req.json();
    const planId = String(body.planId ?? "").trim();
    if (!planId) return apiError("planId required", 400, "MISSING_FIELDS");

    if (body.acceptedPaymentTerms !== true) {
      return apiError("Accept offer and refund policy before payment", 400, "PAYMENT_TERMS_REQUIRED");
    }

    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    try {
      await assertPaymentConsents(authUser.userId);
    } catch {
      return apiError("Legal consent required. Please accept terms in account settings.", 403, "LEGAL_CONSENT_REQUIRED");
    }

    await recordConsents(authUser.userId, [
      { consentType: "payment_terms", documentVersion: getConsentVersion("payment_terms"), locale: "ru" },
    ]);

    const intent = await createSubscriptionPaymentIntent({
      userId: authUser.userId,
      planId,
    });

    await writeAuditLog({
      userId: authUser.userId,
      action: "payment_intent_created",
      entityType: "payment",
      entityId: intent.paymentId,
      metadata: { planId, amountTiyin: intent.amountTiyin },
    });

    return apiSuccess(intent, 201);
  } catch (err) {
    console.error("POST /payments/intent error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
