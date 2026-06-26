export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listGrantRequirements, addGrantRequirement } from "@/lib/db/admin-grants";

export const GET = withAdmin(async (_req, admin, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const requirements = await listGrantRequirements(id, admin.accessToken);
  return apiSuccess({ requirements });
});

export const POST = withAdmin(async (req, admin, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();
  const text = String(body.text ?? "").trim();
  if (!text) return apiError("text required", 400, "MISSING_FIELDS");

  const requirementId = await addGrantRequirement(
    id,
    {
      text,
      requirementType: body.requirementType ? String(body.requirementType) : undefined,
      required: body.required !== false,
    },
    admin.accessToken
  );
  return apiSuccess({ id: requirementId }, 201);
});
