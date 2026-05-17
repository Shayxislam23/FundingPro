import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser, writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/applications
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdmin();

  let query = supabase
    .from("applications")
    .select(`
      id,
      status,
      notes,
      created_at,
      updated_at,
      grant:grants ( id, title, title_ru, deadline, amount_min, amount_max, donor:donors ( name, name_ru ) )
    `, { count: "exact" })
    .eq("user_id", authUser.userId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data: applications, count, error } = await query;
  if (error) return apiError("Internal error", 500, "INTERNAL_ERROR");

  const total = count ?? 0;
  return apiSuccess({ applications: applications ?? [], total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/v1/applications
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { grantId, notes } = body;
    if (!grantId) return apiError("grantId required", 400, "MISSING_FIELDS");

    const supabase = createSupabaseAdmin();

    // Verify grant exists
    const { data: grant } = await supabase.from("grants").select("id").eq("id", grantId).single();
    if (!grant) return apiError("Grant not found", 404, "GRANT_NOT_FOUND");

    // Prevent duplicate
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", authUser.userId)
      .eq("grant_id", grantId)
      .maybeSingle();

    if (existing) {
      return apiSuccess({ applicationId: existing.id, status: existing.status, alreadyExists: true });
    }

    const { data: application, error } = await supabase
      .from("applications")
      .insert({ user_id: authUser.userId, grant_id: grantId, status: "saved", notes: notes ?? null })
      .select("id, status")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditLog({ userId: authUser.userId, action: "application_create", entityType: "application", entityId: application.id, metadata: { grantId } });

    return apiSuccess({ applicationId: application.id, status: application.status }, 201);
  } catch (err) {
    console.error("POST /applications error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
