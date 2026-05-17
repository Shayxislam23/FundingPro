import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// POST /api/v1/ai/match-grants
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { organizationProfile } = body;

    // AI DATA POLICY: only allow anonymized org profile
    // No personal data, PINFL, passport, payment IDs

    // TODO: call AI Gateway with anonymized profile + grant database
    // TODO: return top 10 matched grants with scores
    // TODO: log AIRequest

    return apiSuccess({
      matches: [],
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
