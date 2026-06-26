export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { groupPlansByTarget, listPlans } from "@/lib/db/plans";
import { getUsdUzsRate } from "@/lib/legal/documents";

// GET /api/v1/plans — public subscription plans from database
export const GET = withPublic(async () => {
  try {
    const plans = await listPlans();
    const grouped = groupPlansByTarget(plans);
    return apiSuccess({ plans, grouped, total: plans.length, usdUzsRate: getUsdUzsRate() });
  } catch (err) {
    console.error("GET /plans error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
});
