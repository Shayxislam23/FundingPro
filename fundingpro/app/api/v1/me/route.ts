export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/me
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const supabase = createSupabaseAdmin();

  // Get user profile from Supabase auth
  const { data: { user }, error } = await supabase.auth.admin.getUserById(authUser.supabaseId);
  if (error || !user) return apiError("User not found", 404, "NOT_FOUND");

  return apiSuccess({
    id: user.id,
    email: user.email,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at,
    organization: null,
    subscription: null,
    paymentIntegrationStatus: "pending_integration",
  });
}
