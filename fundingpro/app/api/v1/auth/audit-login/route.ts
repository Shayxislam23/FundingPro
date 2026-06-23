export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";

// POST /api/v1/auth/audit-login — log successful OTP login + ensure internal user
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const internal = await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      emailVerified: true,
      provider: "supabase_email",
    });

    await writeAuditLog({
      userId: internal.id,
      action: "auth_login",
      entityType: "user",
      entityId: internal.id,
      metadata: { method: "email_otp", isNew: internal.isNew },
    });

    return apiSuccess({ userId: internal.id, isNew: internal.isNew });
  } catch (err) {
    console.error("POST /auth/audit-login error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
