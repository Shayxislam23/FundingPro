export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { listAdminUsers, setUserActive } from "@/lib/db/admin-users";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const search = searchParams.get("search") ?? "";

  const result = await listAdminUsers({ page, limit: perPage, search: search || undefined });
  return apiSuccess(result);
});

export const PATCH = withAdmin(async (req, admin) => {
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
});
