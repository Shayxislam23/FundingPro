export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listGrantRequirements, addGrantRequirement } from "@/lib/db/admin-grants";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(_req);
  } catch (e) {
    return e as Response;
  }
  try {
    const requirements = await listGrantRequirements(params.id);
    return apiSuccess({ requirements });
  } catch (err) {
    console.error("GET /admin/grants/requirements error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    if (!text) return apiError("text required", 400, "MISSING_FIELDS");
    const id = await addGrantRequirement(params.id, {
      text,
      requirementType: body.requirementType ? String(body.requirementType) : undefined,
      required: body.required !== false,
    });
    return apiSuccess({ id }, 201);
  } catch (err) {
    console.error("POST /admin/grants/requirements error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
