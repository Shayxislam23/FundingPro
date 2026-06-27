export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { assertPaymentConsents, recordConsents } from "@/lib/db/consents";
import { ensureInternalUser } from "@/lib/db/users";
import { createSubscriptionPaymentIntent, getDefaultProvider, isPaymentsEnabled, parsePaymentProvider } from "@/lib/payments";
import { getConsentVersion } from "@/lib/legal/documents";

export const POST = withActiveUser(async (req, authUser) => {
  if (!isPaymentsEnabled()) {
    return apiError("Payments are not enabled", 503, "PAYMENTS_DISABLED");
  }

  try {
    const body = await req.json();
    const planId = String(body.planId ?? "").trim();
    if (!planId) return apiError("planId required", 400, "MISSING_FIELDS");

    const provider = parsePaymentProvider(body.provider) ?? getDefaultProvider();

    if (body.acceptedPaymentTerms !== true) {
      return apiError("Accept offer and refund policy before payment", 400, "PAYMENT_TERMS_REQUIRED");
    }

    await ensureInternalUser(
      {
        email: authUser.email,
        provider: "clerk",
      },
      authUser.accessToken
    );

    try {
      await assertPaymentConsents(authUser.accessToken);
    } catch {
      return apiError("Legal consent required. Please accept terms in account settings.", 403, "LEGAL_CONSENT_REQUIRED");
    }

    await recordConsents(
      [
        {
          consentType: "payment_terms",
          documentVersion: getConsentVersion("payment_terms"),
          locale: "ru",
        },
      ],
      authUser.accessToken
    );

    const platform = typeof body.platform === "string" ? body.platform : "web";

    const intent = await createSubscriptionPaymentIntent({
      planId,
      accessToken: authUser.accessToken,
      provider,
    });

    await writeAuditLog({
      userId: authUser.userId,
      action: "payment_intent_created",
      entityType: "payment",
      entityId: intent.paymentId,
      metadata: { planId, amountTiyin: intent.amountTiyin, platform, provider },
    });

    return apiSuccess(intent, 201);
  } catch (err) {
    console.error("POST /payments/intent error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
