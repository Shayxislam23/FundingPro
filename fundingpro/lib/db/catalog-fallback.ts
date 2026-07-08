/**
 * Static seed-backed fallback for the public catalog endpoints
 * (/api/v1/plans, /api/v1/grants, /api/v1/grants/:id).
 *
 * Used ONLY when PUBLIC_API_SEED_FALLBACK=1 and the Convex backend is
 * unreachable — CI integration runs against a placeholder Convex URL and
 * exercises the API contract with this data. Production deployments keep the
 * flag unset so real backend failures surface as errors instead of demo data.
 *
 * Mirrors the philosophy of mobile/lib/public-fallback.ts, sourced from
 * convex/seedData.ts (the same import pattern as lib/seo/grant-sitemap.ts).
 */
import {
  SEED_DONORS,
  SEED_GRANTS,
  SEED_GRANT_REQUIREMENTS,
  SEED_PLANS,
  parseDeadline,
} from "../../convex/seedData";
import type { GrantDetail, GrantListItem, ListGrantsParams, ListGrantsResult } from "./grants.types";
import type { PlanRow } from "./plans";

export function isSeedFallbackEnabled(): boolean {
  return process.env.PUBLIC_API_SEED_FALLBACK === "1";
}

export function seedFallbackPlans(): PlanRow[] {
  return SEED_PLANS.map((plan) => ({
    id: plan.slug,
    name: plan.name,
    nameRu: plan.nameRu,
    targetType: plan.targetType,
    priceUsd: plan.priceUsd,
    priceUzs: plan.priceUzs,
    features: [...plan.features],
    highlighted: plan.slug === "plan-ngo-pro",
  }));
}

function deadlineIso(deadline: string | null): string | null {
  if (!deadline) return null;
  const ms = parseDeadline(deadline);
  return ms === undefined ? null : new Date(ms).toISOString();
}

function donorByKey(donorKey: string) {
  const donor = SEED_DONORS.find((d) => d.key === donorKey);
  return {
    id: donorKey,
    name: donor?.name ?? "Unknown donor",
    name_ru: donor?.nameRu ?? null,
  };
}

function toListItem(grant: (typeof SEED_GRANTS)[number]): GrantListItem {
  return {
    id: grant.key,
    title: grant.title,
    title_ru: grant.titleRu,
    description: grant.descriptionRu ?? grant.description,
    sectors: [...grant.sectors],
    country_scope: [...grant.countryScope],
    amount_min: grant.amountMin,
    amount_max: grant.amountMax,
    deadline: deadlineIso(grant.deadline),
    donor: donorByKey(grant.donorKey),
  };
}

export function seedFallbackGrantsList(params: ListGrantsParams = {}): ListGrantsResult {
  const search = params.search?.trim().toLowerCase();
  let grants = SEED_GRANTS.map(toListItem);

  if (search) {
    grants = grants.filter(
      (g) =>
        g.title.toLowerCase().includes(search) ||
        (g.title_ru ?? "").toLowerCase().includes(search)
    );
  }
  if (params.sector) {
    grants = grants.filter((g) => g.sectors.includes(params.sector as string));
  }
  if (params.country) {
    grants = grants.filter((g) => g.country_scope.includes(params.country as string));
  }
  if (params.donorId) {
    grants = grants.filter((g) => g.donor.id === params.donorId);
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(params.limit ?? 20, 100);
  const total = grants.length;
  const offset = (page - 1) * limit;

  return {
    grants: grants.slice(offset, offset + limit),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
}

export function seedFallbackGrantDetail(id: string): GrantDetail | null {
  const grant = SEED_GRANTS.find((g) => g.key === id);
  if (!grant) return null;

  const donorSeed = SEED_DONORS.find((d) => d.key === grant.donorKey);
  const requirements = SEED_GRANT_REQUIREMENTS.filter((r) => r.grantKey === grant.key);

  return {
    ...toListItem(grant),
    description_ru: grant.descriptionRu,
    donor: {
      ...donorByKey(grant.donorKey),
      website: donorSeed?.website ?? null,
    },
    grant_requirements: requirements.map((r, index) => ({
      id: `${grant.key}-req-${index}`,
      requirement_type: r.requirementType,
      text: r.text,
      required: r.required,
    })),
  };
}
