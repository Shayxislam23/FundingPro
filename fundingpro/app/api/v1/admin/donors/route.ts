export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listDonors, createDonor } from "@/lib/db/admin-grants";

export const GET = withAdmin(async () => {
  const donors = await listDonors();
  return apiSuccess({ donors });
});

export const POST = withAdmin(async (req) => {
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
});
