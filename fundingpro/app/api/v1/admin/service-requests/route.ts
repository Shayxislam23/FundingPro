export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import type { Id } from "@/convex/_generated/dataModel";

const STATUSES = new Set(["new", "contacted", "qualified", "won", "lost"]);

export const GET = withAdmin(async (req, admin) => {
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  if (status && !STATUSES.has(status)) return apiError("Unknown status", 400, "INVALID_REQUEST");
  const requests = await convexQuery(
    api.serviceRequests.list,
    { status: status as "new" | undefined, limit: 300 },
    admin.accessToken
  );
  return apiSuccess({ requests });
});

export const PATCH = withAdmin(async (req, admin) => {
  const body = (await req.json().catch(() => null)) as { id?: string; status?: string; notes?: string } | null;
  if (!body?.id) return apiError("id required", 400, "INVALID_REQUEST");
  if (body.status && !STATUSES.has(body.status)) return apiError("Unknown status", 400, "INVALID_REQUEST");
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 4000)) {
    return apiError("notes too long", 400, "INVALID_REQUEST");
  }
  try {
    await convexMutation(
      api.serviceRequests.update,
      { id: body.id as Id<"serviceRequests">, status: body.status as "new" | undefined, notes: body.notes },
      admin.accessToken
    );
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Update failed", 400, "UPDATE_FAILED");
  }
  await writeAuditLog({
    userId: admin.userId,
    action: "service_request_update",
    entityType: "service_request",
    entityId: body.id,
    metadata: { status: body.status ?? "" },
  });
  return apiSuccess({ updated: true });
});
