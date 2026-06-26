import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const grantListValidator = v.object({
  id: v.string(),
  title: v.string(),
  title_ru: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  sectors: v.array(v.string()),
  country_scope: v.array(v.string()),
  amount_min: v.union(v.number(), v.null()),
  amount_max: v.union(v.number(), v.null()),
  deadline: v.union(v.string(), v.null()),
  donor: v.object({
    id: v.string(),
    name: v.string(),
    name_ru: v.union(v.string(), v.null()),
  }),
});

const listResultValidator = v.object({
  grants: v.array(grantListValidator),
  total: v.number(),
  page: v.number(),
  limit: v.number(),
  pages: v.number(),
});

function mapGrantListItem(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null
) {
  return {
    id: grant._id,
    title: grant.title,
    title_ru: grant.titleRu ?? null,
    description: grant.description ?? null,
    sectors: grant.sectors,
    country_scope: grant.countryScope,
    amount_min: grant.amountMin ?? null,
    amount_max: grant.amountMax ?? null,
    deadline: grant.deadline ? new Date(grant.deadline).toISOString() : null,
    donor: {
      id: donor?._id ?? "",
      name: donor?.name ?? "",
      name_ru: donor?.nameRu ?? null,
    },
  };
}

function matchesSearch(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null,
  search: string
): boolean {
  const q = search.toLowerCase();
  const haystack = [
    grant.title,
    grant.titleRu,
    grant.description,
    donor?.name,
    donor?.nameRu,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    sector: v.optional(v.string()),
    country: v.optional(v.string()),
    donorId: v.optional(v.string()),
    deadlineBefore: v.optional(v.string()),
    deadlineAfter: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    page: v.number(),
    limit: v.number(),
  },
  returns: listResultValidator,
  handler: async (ctx, args) => {
    let grants = await ctx.db
      .query("grants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (args.featured) {
      grants = grants.filter((g) => g.isFeatured);
    }

    const donorCache = new Map<string, Doc<"donors"> | null>();
    async function getDonor(id: Id<"donors">) {
      if (!donorCache.has(id)) {
        donorCache.set(id, await ctx.db.get("donors", id));
      }
      return donorCache.get(id) ?? null;
    }

    const filtered: Array<{ grant: Doc<"grants">; donor: Doc<"donors"> | null }> = [];
    for (const grant of grants) {
      const donor = await getDonor(grant.donorId);

      if (args.search && !matchesSearch(grant, donor, args.search)) continue;
      if (args.sector && !grant.sectors.includes(args.sector)) continue;
      if (args.country && !grant.countryScope.includes(args.country)) continue;
      if (args.donorId && grant.donorId !== args.donorId) continue;
      if (args.deadlineBefore && grant.deadline) {
        if (grant.deadline > new Date(args.deadlineBefore).getTime()) continue;
      }
      if (args.activeOnly) {
        const today = new Date().setHours(0, 0, 0, 0);
        const openStatuses = ["open", "upcoming", "active"];
        if (!openStatuses.includes(grant.status)) continue;
        if (grant.deadline && grant.deadline < today) continue;
      } else if (args.deadlineAfter) {
        const after = new Date(args.deadlineAfter).getTime();
        if (grant.deadline && grant.deadline < after) continue;
      }

      filtered.push({ grant, donor });
    }

    filtered.sort((a, b) => {
      const da = a.grant.deadline ?? Number.MAX_SAFE_INTEGER;
      const db = b.grant.deadline ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

    const total = filtered.length;
    const offset = (args.page - 1) * args.limit;
    const pageItems = filtered.slice(offset, offset + args.limit);

    return {
      grants: pageItems.map(({ grant, donor }) => mapGrantListItem(grant, donor)),
      total,
      page: args.page,
      limit: args.limit,
      pages: Math.ceil(total / args.limit) || 1,
    };
  },
});

export const getById = query({
  args: { id: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      title: v.string(),
      title_ru: v.union(v.string(), v.null()),
      description: v.union(v.string(), v.null()),
      description_ru: v.union(v.string(), v.null()),
      sectors: v.array(v.string()),
      country_scope: v.array(v.string()),
      amount_min: v.union(v.number(), v.null()),
      amount_max: v.union(v.number(), v.null()),
      deadline: v.union(v.string(), v.null()),
      donor: v.object({
        id: v.string(),
        name: v.string(),
        name_ru: v.union(v.string(), v.null()),
        website: v.union(v.string(), v.null()),
      }),
      grant_requirements: v.array(
        v.object({
          id: v.string(),
          requirement_type: v.string(),
          text: v.string(),
          required: v.boolean(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let grant: Doc<"grants"> | null = null;
    try {
      grant = await ctx.db.get("grants", args.id as Id<"grants">);
    } catch {
      return null;
    }
    if (!grant) return null;

    const donor = await ctx.db.get("donors", grant.donorId);
    const requirements = await ctx.db
      .query("grantRequirements")
      .withIndex("by_grant", (q) => q.eq("grantId", grant!._id))
      .collect();

    const base = mapGrantListItem(grant, donor);
    return {
      ...base,
      description_ru: grant.descriptionRu ?? null,
      donor: {
        id: donor?._id ?? "",
        name: donor?.name ?? "",
        name_ru: donor?.nameRu ?? null,
        website: donor?.website ?? null,
      },
      grant_requirements: requirements.map((r) => ({
        id: r._id,
        requirement_type: r.requirementType,
        text: r.text,
        required: r.required,
      })),
    };
  },
});

export const healthCheck = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const grant = await ctx.db.query("grants").first();
    return grant !== null || true;
  },
});
