export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { getGrantById } from "@/lib/db/grants";

// GET /api/v1/grants/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (isLocalDatabaseEnabled()) {
      const grant = await getGrantById(params.id);
      if (!grant) return apiError("Grant not found", 404, "NOT_FOUND");
      return apiSuccess(grant);
    }

    const supabase = createSupabaseAdmin();

    const { data: grant, error } = await supabase
      .from("grants")
      .select(`
        id,
        title,
        title_ru,
        description,
        description_ru,
        sectors,
        country_scope,
        amount_min,
        amount_max,
        deadline,
        donor:donors ( id, name, name_ru, website ),
        grant_requirements ( id, requirement_type, text, required )
      `)
      .eq("id", params.id)
      .single();

    if (error || !grant) return apiError("Grant not found", 404, "NOT_FOUND");

    return apiSuccess(grant);
  } catch (err) {
    console.error("GET /grants/[id] error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
