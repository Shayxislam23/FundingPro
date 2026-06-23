export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { createSubscriptionRequest, getPlanPriceUsd } from "@/lib/db/subscription-requests";

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { planId, planName } = body;

  if (!planId?.trim() || !planName?.trim()) {
    return apiError("planId and planName required", 400, "MISSING_FIELDS");
  }

  await ensureInternalUser({
    supabaseId: authUser.supabaseId,
    email: authUser.email,
    provider: "supabase_email",
  });

  const amountUsd = (await getPlanPriceUsd(planId.trim())) ?? 0;

  const result = await createSubscriptionRequest({
    userId: authUser.userId,
    email: authUser.email,
    planId: planId.trim(),
    planName: planName.trim(),
    amountUsd,
  });

  await writeAuditLog({
    userId: authUser.userId,
    action: "subscription_request",
    entityType: "subscription",
    entityId: result.subscriptionRequestId,
    metadata: { planId, planName, amountUsd },
  });

  return apiSuccess(result, 201);
});
