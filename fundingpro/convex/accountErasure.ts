import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/** 30-day grace period per privacy policy before hard purge. */
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const USERS_PER_RUN = 5;

const purgeResultValidator = v.object({
  processed: v.number(),
  purgedUserIds: v.array(v.id("users")),
});

async function deleteUserApplications(ctx: MutationCtx, userId: Id<"users">) {
  while (true) {
    const batch = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    if (batch.length === 0) break;
    for (const app of batch) {
      await ctx.db.delete("applications", app._id);
    }
  }
}

async function deleteUserDocuments(ctx: MutationCtx, userId: Id<"users">) {
  while (true) {
    const batch = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    if (batch.length === 0) break;
    for (const doc of batch) {
      if (doc.storageId) {
        await ctx.storage.delete(doc.storageId);
      }
      await ctx.db.delete("documents", doc._id);
    }
  }
}

async function deleteUserPushTokens(ctx: MutationCtx, userId: Id<"users">) {
  while (true) {
    const batch = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    if (batch.length === 0) break;
    for (const row of batch) {
      await ctx.db.delete("pushTokens", row._id);
    }
  }
}

async function deleteUserOrganizationMembers(ctx: MutationCtx, userId: Id<"users">) {
  while (true) {
    const batch = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    if (batch.length === 0) break;
    for (const membership of batch) {
      await ctx.db.delete("organizationMembers", membership._id);
    }
  }
}

async function deleteUserIdentities(ctx: MutationCtx, userId: Id<"users">) {
  while (true) {
    const batch = await ctx.db
      .query("userIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    if (batch.length === 0) break;
    for (const identity of batch) {
      await ctx.db.delete("userIdentities", identity._id);
    }
  }
}

async function purgeUserCascade(ctx: MutationCtx, userId: Id<"users">) {
  await deleteUserApplications(ctx, userId);
  await deleteUserDocuments(ctx, userId);
  await deleteUserPushTokens(ctx, userId);
  await deleteUserOrganizationMembers(ctx, userId);
  await deleteUserIdentities(ctx, userId);

  const now = Date.now();
  await ctx.db.patch("users", userId, {
    deletedAt: now,
    updatedAt: now,
    email: undefined,
    phone: undefined,
    clerkId: `deleted_${userId}`,
    tokenIdentifier: `deleted_${userId}`,
    isActive: false,
  });
}

export const purgeEligibleAccounts = internalMutation({
  args: {},
  returns: purgeResultValidator,
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS;
    const candidates = await ctx.db
      .query("users")
      .withIndex("by_deletion_requested", (q) => q.lte("deletionRequestedAt", cutoff))
      .take(USERS_PER_RUN);

    const purgedUserIds: Id<"users">[] = [];

    for (const user of candidates) {
      if (user.deletedAt !== undefined) continue;
      if (user.deletionRequestedAt === undefined) continue;

      await purgeUserCascade(ctx, user._id);
      purgedUserIds.push(user._id);
    }

    return { processed: purgedUserIds.length, purgedUserIds };
  },
});
