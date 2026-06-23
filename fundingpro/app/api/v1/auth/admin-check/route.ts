export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { canAccessAdmin } from "@/lib/auth/admin-access";

/** GET /api/v1/auth/admin-check — used by middleware for unified admin gate. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, data: { isAdmin: false } }, { status: 401 });
  }

  const isAdmin = await canAccessAdmin(user.userId, user.email);
  return apiSuccess({ isAdmin });
}
