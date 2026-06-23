export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { getOnboardingStatus } from "@/lib/db/onboarding";

// GET /api/v1/onboarding/status
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const status = await getOnboardingStatus(authUser.userId);
    return apiSuccess(status);
  } catch (err) {
    console.error("GET /onboarding/status error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
