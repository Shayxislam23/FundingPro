export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { getPlanUsage } from "@/lib/plan-limits";
import { getUserSubscription } from "@/lib/db/users";

// GET /api/v1/plan-usage
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const [usage, subscription] = await Promise.all([
      getPlanUsage(authUser.userId),
      getUserSubscription(authUser.userId),
    ]);

    return apiSuccess({
      ...usage,
      planName: subscription?.plan?.nameRu ?? subscription?.plan?.name ?? "Бесплатный",
      subscriptionStatus: subscription?.status ?? "free",
    });
  } catch (err) {
    console.error("GET /plan-usage error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
