export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { getGrantById } from "@/lib/db/grants";

export const GET = withPublic(async (_req, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const grant = await getGrantById(id);
  if (!grant) return apiError("Grant not found", 404, "NOT_FOUND");
  return apiSuccess(grant);
});
