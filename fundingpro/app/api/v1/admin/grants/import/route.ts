export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { bulkImportGrants, type ImportGrantInput } from "@/lib/db/admin-grants";

const MAX_IMPORT_ITEMS = 100;

function cleanStringField(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function cleanArrayField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .map((item) => item.trim().slice(0, 200))
    .slice(0, 20);
  return items.length > 0 ? items : undefined;
}

function cleanNumberField(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * POST /api/v1/admin/grants/import
 * Bulk catalog intake: accepts up to 100 grants keyed by donorName,
 * deduplicates by sourceUrl and by title within the same donor.
 */
export const POST = withAdmin(async (req, admin) => {
  const body = await req.json();
  const rawGrants = body?.grants;

  if (!Array.isArray(rawGrants) || rawGrants.length === 0) {
    return apiError("grants array required", 400, "MISSING_FIELDS");
  }
  if (rawGrants.length > MAX_IMPORT_ITEMS) {
    return apiError(`too many items (max ${MAX_IMPORT_ITEMS})`, 400, "INPUT_TOO_LONG");
  }

  const grants: ImportGrantInput[] = [];
  for (const [index, raw] of rawGrants.entries()) {
    if (!raw || typeof raw !== "object") {
      return apiError(`grants[${index}] must be an object`, 400, "INVALID_ITEM");
    }
    const item = raw as Record<string, unknown>;
    const title = cleanStringField(item.title, 300);
    const donorName = cleanStringField(item.donorName, 200);
    if (!title || !donorName) {
      return apiError(`grants[${index}] requires title and donorName`, 400, "INVALID_ITEM");
    }
    grants.push({
      title,
      donorName,
      titleRu: cleanStringField(item.titleRu, 300),
      description: cleanStringField(item.description, 2000),
      descriptionRu: cleanStringField(item.descriptionRu, 2000),
      sectors: cleanArrayField(item.sectors),
      countryScope: cleanArrayField(item.countryScope),
      applicantTypes: cleanArrayField(item.applicantTypes),
      amountMin: cleanNumberField(item.amountMin),
      amountMax: cleanNumberField(item.amountMax),
      currency: cleanStringField(item.currency, 3),
      deadline: typeof item.deadline === "string" || typeof item.deadline === "number" ? item.deadline : undefined,
      sourceUrl: cleanStringField(item.sourceUrl, 500),
    });
  }

  const result = await bulkImportGrants(grants, admin.accessToken);

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_grants_import",
    entityType: "grant",
    metadata: {
      requested: grants.length,
      inserted: result.inserted,
      skipped: result.skipped,
    },
  });

  return apiSuccess(result, 201);
});
