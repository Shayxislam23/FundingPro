import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { callAi, PROMPTS } from "@/lib/ai-gateway";

// POST /api/v1/ai/match-grants
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { organizationProfile } = body;

    if (!organizationProfile || typeof organizationProfile !== "object") {
      return apiError("organizationProfile required", 400, "MISSING_FIELDS");
    }

    // AI DATA POLICY: strip personal identifiers before sending to AI
    const safeProfile = sanitizeProfile(organizationProfile);
    const profileJson = JSON.stringify(safeProfile);

    const prompt = PROMPTS["match-grants"](profileJson);
    const aiResult = await callAi(prompt, { module: "match-grants", userId: authUser.userId });

    // Parse AI response to extract matched grant IDs + scores
    let matches: { grantId: string; score: number; reason: string }[] = [];
    try {
      const parsed = JSON.parse(aiResult.content);
      if (Array.isArray(parsed)) matches = parsed;
    } catch {
      // AI returned non-JSON — return raw narrative instead
    }

    return apiSuccess({
      matches,
      aiNarrative: matches.length === 0 ? aiResult.content : null,
      aiProvider: aiResult.provider,
      isMockAi: aiResult.isMock,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /ai/match-grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

function sanitizeProfile(profile: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment"];
  return Object.fromEntries(
    Object.entries(profile).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f)))
  );
}
