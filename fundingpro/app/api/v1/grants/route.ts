export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { listGrants } from "@/lib/db/grants";
import { parsePagination, sanitizeLikePattern } from "@/lib/validation";

// GET /api/v1/grants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donor") ?? "";
    const deadlineBefore = searchParams.get("deadlineBefore") ?? "";
    const q = searchParams.get("q") ?? "";
    const search = searchParams.get("search") ?? q;
    const sector = searchParams.get("sector") ?? "";
    const country = searchParams.get("country") ?? "";
    const featured = searchParams.get("featured") === "true";
    const { page, limit, from, to } = parsePagination(searchParams);

    const safeSearch = search ? sanitizeLikePattern(search) : "";

    if (isLocalDatabaseEnabled()) {
      const result = await listGrants({
        search: safeSearch || undefined,
        sector,
        country,
        donorId,
        deadlineBefore: deadlineBefore || undefined,
        featured,
        page,
        limit,
      });
      return apiSuccess(result);
    }

    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("grants")
      .select(`
        id,
        title,
        title_ru,
        description,
        sectors,
        country_scope,
        amount_min,
        amount_max,
        deadline,
        donor:donors ( id, name, name_ru )
      `, { count: "exact" })
      .order("deadline", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (safeSearch) {
      query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }
    if (sector) {
      query = query.contains("sectors", [sector]);
    }
    if (country) {
      query = query.contains("country_scope", [country]);
    }
    if (donorId) {
      query = query.eq("donor_id", donorId);
    }
    if (featured) {
      query = query.eq("featured", true);
    }

    const { data: grants, count, error } = await query;

    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return apiSuccess({ grants: grants ?? [], total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("GET /grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
