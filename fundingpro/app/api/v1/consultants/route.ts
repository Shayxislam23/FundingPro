export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { listConsultants } from "@/lib/db/consultants";

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  try {
    const result = await listConsultants({
      specialty: specialty || undefined,
      country: country || undefined,
      page,
      limit,
    });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /consultants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
