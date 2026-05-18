export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/grants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const sector = searchParams.get("sector") ?? "";
    const country = searchParams.get("country") ?? "";
    const donorId = searchParams.get("donor") ?? "";
    const featured = searchParams.get("featured") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

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

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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

    const { data: grants, count, error } = await query;

    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return apiSuccess({ grants: grants ?? [], total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("GET /grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
