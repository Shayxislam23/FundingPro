import { v } from "convex/values";
import { authedMutation, authedQuery, adminMutation, adminQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";
import type { Id } from "./_generated/dataModel";

const userOrgValidator = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  country: v.union(v.string(), v.null()),
  sector: v.union(v.string(), v.null()),
  role: v.string(),
  isVerified: v.boolean(),
});

export const getForUser = authedQuery({
  args: {},
  returns: v.union(userOrgValidator, v.null()),
  handler: async (ctx) => {
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    if (!membership) return null;
    const org = await ctx.db.get("organizations", membership.organizationId);
    if (!org || org.deletedAt) return null;

    return {
      id: org._id,
      name: org.name,
      type: org.type,
      country: org.country ?? null,
      sector: org.sector ?? null,
      role: membership.role,
      isVerified: org.isVerified,
    };
  },
});

export const createForUser = authedMutation({
  args: {
    name: v.string(),
    type: v.string(),
    country: v.optional(v.string()),
    sector: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ organization: userOrgValidator }),
    v.object({ error: v.literal("ALREADY_HAS_ORG"), organization: userOrgValidator })
  ),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    if (existing) {
      const org = await ctx.db.get("organizations", existing.organizationId);
      if (org) {
        const organization = {
          id: org._id,
          name: org.name,
          type: org.type,
          country: org.country ?? null,
          sector: org.sector ?? null,
          role: existing.role,
          isVerified: org.isVerified,
        };
        return { error: "ALREADY_HAS_ORG" as const, organization };
      }
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      country: args.country,
      sector: args.sector,
      description: args.description,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMembers", {
      organizationId: orgId,
      userId: ctx.user._id,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    });

    return {
      organization: {
        id: orgId,
        name: args.name,
        type: args.type,
        country: args.country ?? null,
        sector: args.sector ?? null,
        role: "ADMIN",
        isVerified: false,
      },
    };
  },
});

export const updateForUser = authedMutation({
  args: {
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    country: v.optional(v.string()),
    sector: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.union(userOrgValidator, v.null()),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();
    if (!membership) return null;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.type !== undefined) patch.type = args.type;
    if (args.country !== undefined) patch.country = args.country;
    if (args.sector !== undefined) patch.sector = args.sector;
    if (args.description !== undefined) patch.description = args.description;

    await ctx.db.patch("organizations", membership.organizationId, patch);
    const org = await ctx.db.get("organizations", membership.organizationId);
    if (!org) return null;

    return {
      id: org._id,
      name: org.name,
      type: org.type,
      country: org.country ?? null,
      sector: org.sector ?? null,
      role: membership.role,
      isVerified: org.isVerified,
    };
  },
});

export const setVerified = adminMutation({
  args: { orgId: v.string(), verified: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("organizations", args.orgId as Id<"organizations">, {
      isVerified: args.verified,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listAll = adminQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      country: v.union(v.string(), v.null()),
      sector: v.union(v.string(), v.null()),
      isVerified: v.boolean(),
      memberCount: v.number(),
      readinessScore: v.number(),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const orgs = await paginateAll(ctx.db.query("organizations"));
    const active = orgs.filter((o) => !o.deletedAt).slice(0, limit);

    const result = [];
    for (const org of active) {
      const members = await paginateAll(
        ctx.db
          .query("organizationMembers")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      );
      result.push({
        id: org._id,
        name: org.name,
        type: org.type,
        country: org.country ?? null,
        sector: org.sector ?? null,
        isVerified: org.isVerified,
        memberCount: members.length,
        readinessScore: org.isVerified ? 80 : 40,
        createdAt: new Date(org.createdAt).toISOString(),
      });
    }
    return result;
  },
});
