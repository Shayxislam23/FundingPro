export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import {
  createSubscriptionRequest,
  getPlanPriceUsd,
  listPendingSubscriptionPlanIds,
} from "@/lib/db/subscription-requests";

export const GET = withActiveUser(async (_req, authUser) => {
  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const pendingPlanIds = await listPendingSubscriptionPlanIds(authUser.accessToken);
  return apiSuccess({ pendingPlanIds });
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { planId, planName } = body;

  if (!planId?.trim() || !planName?.trim()) {
    return apiError("planId and planName required", 400, "MISSING_FIELDS");
  }

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const amountUsd = (await getPlanPriceUsd(planId.trim())) ?? 0;

  const rate = Number(process.env.USD_UZS_RATE ?? 12800);
  const amountUzs = Math.round(amountUsd * rate);
  const amountTiyin = amountUzs * 100;

  const result = await createSubscriptionRequest(
    {
      planId: planId.trim(),
      planName: planName.trim(),
      amountUsd,
      amountUzs,
      amountTiyin,
    },
    authUser.accessToken
  );

  await writeAuditLog({
    userId: authUser.userId,
    action: "subscription_request",
    entityType: "subscription",
    entityId: result.subscriptionRequestId,
    metadata: { planId, planName, amountUsd },
  });

  return apiSuccess(result, 201);
});
