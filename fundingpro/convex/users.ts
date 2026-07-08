import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureUser,
  externalUserId,
  getUserByExternalId,
  requireIdentity,
} from "./lib/auth";
import { authedMutation, authedQuery, adminMutation, adminQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";
import { patchUserMode, resolveUserMode } from "./lib/userMode";
import { resolvedUserModeValidator, userModeValidator } from "./lib/validators";
import type { Doc } from "./_generated/dataModel";

const internalUserValidator = v.object({
  id: v.string(),
  email: v.union(v.string(), v.null()),
  emailVerified: v.boolean(),
  isActive: v.boolean(),
  createdAt: v.string(),
  isNew: v.boolean(),
});

export const ensureInternal = mutation({
  args: {
    email: v.union(v.string(), v.null()),
    emailVerified: v.optional(v.boolean()),
    provider: v.optional(v.string()),
  },
  returns: internalUserValidator,
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const { user, isNew } = await ensureUser(ctx, {
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: args.email,
      emailVerified: args.emailVerified,
      provider: args.provider ?? "clerk",
    });

    return {
      id: externalUserId(user),
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: new Date(user.createdAt).toISOString(),
      isNew,
    };
  },
});

export const getSubscription = authedQuery({
  args: {},
  returns: v.union(
    v.object({
      id: v.string(),
      status: v.string(),
      startDate: v.union(v.string(), v.null()),
      endDate: v.union(v.string(), v.null()),
      plan: v.union(
        v.object({
          id: v.string(),
          name: v.string(),
          nameRu: v.union(v.string(), v.null()),
          priceUsd: v.number(),
        }),
        v.null()
      ),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", ctx.user._id).eq("status", "ACTIVE")
      )
      .order("desc")
      .first();

    if (!subscription) return null;
    // Defense in depth: treat past-endDate rows as expired even if the
    // hourly expiry cron has not flipped their status yet.
    if (subscription.endDate && subscription.endDate < Date.now()) return null;

    const plan = await ctx.db.get("plans", subscription.planId);
    return {
      id: subscription._id,
      status: subscription.status,
      startDate: subscription.startDate
        ? new Date(subscription.startDate).toISOString()
        : null,
      endDate: subscription.endDate
        ? new Date(subscription.endDate).toISOString()
        : null,
      plan: plan
        ? {
            id: plan.slug || plan._id,
            name: plan.name,
            nameRu: plan.nameRu ?? null,
            priceUsd: plan.priceUsd,
          }
        : null,
    };
  },
});

export const getPlatformRole = authedQuery({
  args: {},
  returns: v.union(v.literal("user"), v.literal("admin")),
  handler: async (ctx) => {
    return ctx.user.platformRole;
  },
});

export const getAccountStatus = authedQuery({
  args: {},
  returns: v.object({
    isActive: v.boolean(),
    isBanned: v.boolean(),
  }),
  handler: async (ctx) => {
    return {
      isActive: ctx.user.isActive,
      isBanned: ctx.user.isBanned,
    };
  },
});

export const getMe = authedQuery({
  args: {},
  returns: v.object({
    id: v.string(),
    clerkId: v.string(),
    email: v.union(v.string(), v.null()),
    emailVerified: v.boolean(),
    isActive: v.boolean(),
    isBanned: v.boolean(),
    createdAt: v.string(),
    platformRole: v.union(v.literal("user"), v.literal("admin")),
    userMode: userModeValidator,
  }),
  handler: async (ctx) => {
    return {
      id: externalUserId(ctx.user),
      clerkId: ctx.user.clerkId,
      email: ctx.user.email ?? null,
      emailVerified: ctx.user.emailVerified,
      isActive: ctx.user.isActive,
      isBanned: ctx.user.isBanned,
      createdAt: new Date(ctx.user.createdAt).toISOString(),
      platformRole: ctx.user.platformRole,
      userMode: await resolveUserMode(ctx, ctx.user),
    };
  },
});

export const getUserMode = authedQuery({
  args: {},
  returns: resolvedUserModeValidator,
  handler: async (ctx) => {
    return await resolveUserMode(ctx, ctx.user);
  },
});

export const setUserMode = authedMutation({
  args: {
    userMode: v.literal("individual"),
  },
  returns: resolvedUserModeValidator,
  handler: async (ctx, args) => {
    await patchUserMode(ctx, ctx.user._id, args.userMode);
    return args.userMode;
  },
});

export const setUserActive = adminMutation({
  args: {
    userId: v.string(),
    isActive: v.boolean(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.userId);
    if (!user) return false;
    await ctx.db.patch("users", user._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const listAdmin = adminQuery({
  args: {
    page: v.number(),
    limit: v.number(),
    search: v.optional(v.string()),
  },
  returns: v.object({
    users: v.array(
      v.object({
        id: v.string(),
        email: v.union(v.string(), v.null()),
        isActive: v.boolean(),
        platformRole: v.string(),
        createdAt: v.string(),
      })
    ),
    total: v.number(),
    page: v.number(),
    perPage: v.number(),
  }),
  handler: async (ctx, args) => {
    // Admin email search: exact match via by_email only (no partial/substring scan).
    if (args.search) {
      if (!args.search.includes("@")) {
        return {
          users: [],
          total: 0,
          page: args.page,
          perPage: args.limit,
        };
      }

      const exact = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.search))
        .first();
      if (exact) {
        return {
          users: [
            {
              id: externalUserId(exact),
              email: exact.email ?? null,
              isActive: exact.isActive,
              platformRole: exact.platformRole,
              createdAt: new Date(exact.createdAt).toISOString(),
            },
          ],
          total: 1,
          page: args.page,
          perPage: args.limit,
        };
      }

      return {
        users: [],
        total: 0,
        page: args.page,
        perPage: args.limit,
      };
    }

    const users: Doc<"users">[] = [];
    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const batch = await ctx.db
        .query("users")
        .withIndex("by_created")
        .order("desc")
        .paginate({ numItems: 100, cursor });
      users.push(...batch.page);
      isDone = batch.isDone;
      cursor = batch.continueCursor;
    }

    const total = users.length;
    const offset = (args.page - 1) * args.limit;
    const pageUsers = users.slice(offset, offset + args.limit);
    return {
      users: pageUsers.map((u) => ({
        id: externalUserId(u),
        email: u.email ?? null,
        isActive: u.isActive,
        platformRole: u.platformRole,
        createdAt: new Date(u.createdAt).toISOString(),
      })),
      total,
      page: args.page,
      perPage: args.limit,
    };
  },
});

export const syncProfile = authedMutation({
  args: {
    email: v.optional(v.union(v.string(), v.null())),
    emailVerified: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.email !== undefined) patch.email = args.email ?? undefined;
    if (args.emailVerified !== undefined) patch.emailVerified = args.emailVerified;
    await ctx.db.patch("users", ctx.user._id, patch);
    return null;
  },
});

export const resolveUserId = authedQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return ctx.user._id;
  },
});

export const requestAccountDeletion = authedMutation({
  args: {},
  returns: v.object({
    status: v.literal("pending"),
    requestedAt: v.string(),
    userId: v.string(),
  }),
  handler: async (ctx) => {
    if (ctx.user.deletionRequestedAt) {
      throw new Error("Account deletion already requested");
    }

    const now = Date.now();
    await ctx.db.patch("users", ctx.user._id, {
      isActive: false,
      deletionRequestedAt: now,
      updatedAt: now,
    });

    const memberships = await paginateAll(
      ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
    );

    for (const membership of memberships) {
      const org = await ctx.db.get("organizations", membership.organizationId);
      if (org && !org.deletedAt) {
        await ctx.db.patch("organizations", org._id, {
          deletedAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      status: "pending" as const,
      requestedAt: new Date(now).toISOString(),
      userId: externalUserId(ctx.user),
    };
  },
});
