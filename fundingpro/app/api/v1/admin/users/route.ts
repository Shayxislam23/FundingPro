export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin, writeAuditLog } from "@/lib/auth-helpers";
import { listAdminUsers, setUserActive } from "@/lib/db/admin-users";

// GET /api/v1/admin/users?page=1&limit=20&search=
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const search = searchParams.get("search") ?? "";

  try {
    const result = await listAdminUsers({ page, limit: perPage, search: search || undefined });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /admin/users error:", err);
    return apiError("Failed to list users", 500, "INTERNAL_ERROR");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const userId = String(body.userId ?? "");
    const isActive = body.isActive !== false;
    if (!userId) return apiError("userId required", 400, "MISSING_FIELDS");

    const ok = await setUserActive(userId, isActive);
    if (!ok) return apiError("User not found", 404, "NOT_FOUND");

    await writeAuditLog({
      userId: admin.userId,
      action: isActive ? "admin_user_activate" : "admin_user_deactivate",
      entityType: "user",
      entityId: userId,
    });

    return apiSuccess({ userId, isActive });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /admin/users error:", e);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
