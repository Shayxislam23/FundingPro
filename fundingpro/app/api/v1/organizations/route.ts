export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getUserOrganizationDetails, createOrganizationForUser, updateOrganizationForUser } from "@/lib/db/organizations";

const ORG_TYPES = ["NGO", "BUSINESS", "ACADEMIC", "GOVERNMENT", "INDIVIDUAL"];

// GET /api/v1/organizations — current user's organization
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    const organization = await getUserOrganizationDetails(authUser.userId);
    return apiSuccess({ organization });
  } catch (err) {
    console.error("GET /organizations error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// POST /api/v1/organizations — create organization profile
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
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

    const result = await createOrganizationForUser(authUser.userId, {
      name,
      type,
      country,
      sector,
      description,
    });

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
  } catch (err) {
    console.error("POST /organizations error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// PATCH /api/v1/organizations — update organization profile
export async function PATCH(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
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

    const organization = await updateOrganizationForUser(authUser.userId, {
      name,
      type,
      country,
      sector,
      description,
    });

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
  } catch (err) {
    console.error("PATCH /organizations error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
