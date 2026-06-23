export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listDonors, createDonor } from "@/lib/db/admin-grants";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }
  try {
    const donors = await listDonors();
    return apiSuccess({ donors });
  } catch (err) {
    console.error("GET /admin/donors error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return apiError("name required", 400, "MISSING_FIELDS");
    const id = await createDonor({
      name,
      nameRu: body.nameRu ? String(body.nameRu) : undefined,
      shortName: body.shortName ? String(body.shortName) : undefined,
      country: body.country ? String(body.country) : undefined,
      website: body.website ? String(body.website) : undefined,
    });
    return apiSuccess({ id }, 201);
  } catch (err) {
    console.error("POST /admin/donors error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
