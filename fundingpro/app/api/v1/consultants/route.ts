import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const from = (page - 1) * limit;

  const supabase = createSupabaseAdmin();

  let query = supabase
    .from("consultant_profiles")
    .select("*", { count: "exact" })
    .eq("is_verified", true)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .range(from, from + limit - 1);

  if (country) query = query.eq("country", country);
  if (specialty) query = query.contains("specialties", [specialty]);

  const { data: consultants, count, error } = await query;

  // If table doesn't exist yet, return empty list gracefully
  if (error && error.code === "42P01") {
    return apiSuccess({ consultants: [], total: 0, page, limit });
  }
  if (error) return apiError("Internal error", 500, "INTERNAL_ERROR");

  return apiSuccess({ consultants: consultants ?? [], total: count ?? 0, page, limit, pages: Math.ceil((count ?? 0) / limit) });
}
