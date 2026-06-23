export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { listProposalProjects } from "@/lib/db/proposals";

// GET /api/v1/ai/proposals
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") ?? "10"), 50);
    const proposals = await listProposalProjects(authUser.userId, limit);
    return apiSuccess({ proposals });
  } catch (err) {
    console.error("GET /ai/proposals error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
