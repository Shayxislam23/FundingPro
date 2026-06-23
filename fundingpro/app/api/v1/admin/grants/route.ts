export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin, writeAuditLog } from "@/lib/auth-helpers";
import { listAdminGrants, createGrant } from "@/lib/db/admin-grants";

// GET /api/v1/admin/grants
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const result = await listAdminGrants({ search, page, limit });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /admin/grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// POST /api/v1/admin/grants
export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const body = await req.json();
    const { title, titleRu, description, donorId, sectors, countryScope, amountMin, amountMax, deadline, sourceUrl, isActive, isFeatured } = body;

    if (!title?.trim() || !donorId) {
      return apiError("title and donorId required", 400, "MISSING_FIELDS");
    }

    const grantId = await createGrant({
      title: title.trim(),
      titleRu: titleRu?.trim(),
      description: description?.trim(),
      donorId,
      sectors: Array.isArray(sectors) ? sectors : [],
      countryScope: Array.isArray(countryScope) ? countryScope : ["Uzbekistan"],
      amountMin: amountMin != null ? Number(amountMin) : null,
      amountMax: amountMax != null ? Number(amountMax) : null,
      deadline: deadline || null,
      sourceUrl: sourceUrl?.trim(),
      isActive: isActive !== false,
      isFeatured: !!isFeatured,
    });

    await writeAuditLog({
      userId: admin.userId,
      action: "admin_grant_create",
      entityType: "grant",
      entityId: grantId,
      metadata: { title },
    });

    return apiSuccess({ grantId }, 201);
  } catch (err) {
    console.error("POST /admin/grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
