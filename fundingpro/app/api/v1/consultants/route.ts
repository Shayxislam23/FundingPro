import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? "";
  const country = searchParams.get("country") ?? "";

  // TODO: query verified, active consultants from database
  return apiSuccess({ consultants: [], total: 0 });
}
