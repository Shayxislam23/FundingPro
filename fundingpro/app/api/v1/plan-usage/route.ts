export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getPlanUsage } from "@/lib/plan-limits";
import { getUserSubscription } from "@/lib/db/users";

export const GET = withActiveUser(async (_req, authUser) => {
  const [usage, subscription] = await Promise.all([
    getPlanUsage(authUser.userId),
    getUserSubscription(authUser.userId),
  ]);

  return apiSuccess({
    ...usage,
    planName: subscription?.plan?.nameRu ?? subscription?.plan?.name ?? "Бесплатный",
    subscriptionStatus: subscription?.status ?? "free",
  });
});
