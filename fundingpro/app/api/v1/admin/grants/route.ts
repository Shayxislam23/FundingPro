export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { listAdminGrants, createGrant } from "@/lib/db/admin-grants";

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  const result = await listAdminGrants({ search, page, limit }, admin.accessToken);
  return apiSuccess(result);
});

export const POST = withAdmin(async (req, admin) => {
  const body = await req.json();
  const {
    title,
    titleRu,
    description,
    donorId,
    sectors,
    countryScope,
    amountMin,
    amountMax,
    deadline,
    sourceUrl,
    isActive,
    isFeatured,
  } = body;

  if (!title?.trim() || !donorId) {
    return apiError("title and donorId required", 400, "MISSING_FIELDS");
  }

  const grantId = await createGrant(
    {
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
    },
    admin.accessToken
  );

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_grant_create",
    entityType: "grant",
    entityId: grantId,
    metadata: { title },
  });

  return apiSuccess({ grantId }, 201);
});
