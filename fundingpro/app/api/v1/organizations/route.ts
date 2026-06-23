export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getUserOrganizationDetails, createOrganizationForUser, updateOrganizationForUser } from "@/lib/db/organizations";

const ORG_TYPES = ["NGO", "BUSINESS", "ACADEMIC", "GOVERNMENT", "INDIVIDUAL"];

export const GET = withActiveUser(async (_req, authUser) => {
  await ensureInternalUser({
    supabaseId: authUser.supabaseId,
    email: authUser.email,
    provider: "supabase_email",
  });

  const organization = await getUserOrganizationDetails(authUser.userId, authUser.accessToken);
  return apiSuccess({ organization });
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const type = String(body.type ?? "NGO").toUpperCase();
  const country = body.country ? String(body.country).trim() : undefined;
  const sector = body.sector ? String(body.sector).trim() : undefined;
  const description = body.description ? String(body.description).trim() : undefined;

  if (!name || name.length < 2) {
    return apiError("Organization name required (min 2 chars)", 400, "MISSING_FIELDS");
  }
  if (!ORG_TYPES.includes(type)) {
    return apiError("Invalid organization type", 400, "INVALID_TYPE");
  }

  await ensureInternalUser({
    supabaseId: authUser.supabaseId,
    email: authUser.email,
    provider: "supabase_email",
  });

  const result = await createOrganizationForUser(
    authUser.userId,
    {
      name,
      type,
      country,
      sector,
      description,
    },
    authUser.accessToken
  );

  if ("error" in result && result.error === "ALREADY_HAS_ORG") {
    return apiError("Organization already exists for this user", 409, "ALREADY_EXISTS");
  }

  await writeAuditLog({
    userId: authUser.userId,
    action: "organization_create",
    entityType: "organization",
    entityId: result.organization?.id,
    metadata: { name, type, country, sector },
  });

  return apiSuccess({ organization: result.organization }, 201);
});

export const PATCH = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const type = body.type !== undefined ? String(body.type).toUpperCase() : undefined;
  const country = body.country !== undefined ? String(body.country).trim() : undefined;
  const sector = body.sector !== undefined ? String(body.sector).trim() : undefined;
  const description =
    body.description !== undefined ? String(body.description).trim() : undefined;

  if (name !== undefined && name.length < 2) {
    return apiError("Organization name required (min 2 chars)", 400, "MISSING_FIELDS");
  }
  if (type !== undefined && !ORG_TYPES.includes(type)) {
    return apiError("Invalid organization type", 400, "INVALID_TYPE");
  }

  const organization = await updateOrganizationForUser(
    authUser.userId,
    {
      name,
      type,
      country,
      sector,
      description,
    },
    authUser.accessToken
  );

  if (!organization) {
    return apiError("Organization not found", 404, "NOT_FOUND");
  }

  await writeAuditLog({
    userId: authUser.userId,
    action: "organization_update",
    entityType: "organization",
    entityId: organization.id,
    metadata: { name, type, country, sector },
  });

  return apiSuccess({ organization });
});
