import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/** 30-day grace period per privacy policy before hard purge. */
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const USERS_PER_RUN = 5;

const purgeResultValidator = v.object({
  processed: v.number(),
  purgedUserIds: v.array(v.id("users")),
  clerkDeleted: v.number(),
  clerkSkipped: v.number(),
});

const candidateValidator = v.object({
  userId: v.id("users"),
  clerkId: v.string(),
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

/** Users past the grace period, not yet purged — with the Clerk id needed to delete the auth identity before it's scrubbed. */
export const listPurgeCandidates = internalQuery({
  args: {},
  returns: v.array(candidateValidator),
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS;
    const candidates = await ctx.db
      .query("users")
      .withIndex("by_deletion_requested", (q) => q.lte("deletionRequestedAt", cutoff))
      .take(USERS_PER_RUN);

    return candidates
      .filter((user) => user.deletedAt === undefined && user.deletionRequestedAt !== undefined)
      .map((user) => ({ userId: user._id, clerkId: user.clerkId }));
  },
});

/** Convex-side cascade delete + PII scrub for one user. Call only after the Clerk identity is confirmed gone. */
export const purgeUserRecord = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;
    if (user.deletedAt !== undefined) return null;
    if (user.deletionRequestedAt === undefined) return null;

    await purgeUserCascade(ctx, args.userId);
    return null;
  },
});

/** DELETE https://clerk.com/docs/reference/backend-api/tag/Users#operation/DeleteUser */
async function deleteClerkUser(clerkId: string): Promise<"deleted" | "already_gone" | "failed"> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("accountErasure: CLERK_SECRET_KEY not set, cannot delete Clerk identity");
    return "failed";
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (response.ok) return "deleted";
    if (response.status === 404) return "already_gone";
    console.error("accountErasure: Clerk delete failed", response.status, await response.text());
    return "failed";
  } catch (error) {
    console.error("accountErasure: Clerk delete request failed", error);
    return "failed";
  }
}

/**
 * Runs the 30-day post-request erasure: deletes the Clerk auth identity first
 * (so no login survives "deletion"), then cascades the Convex-side purge.
 * A user whose Clerk delete fails is left for the next run — never purge
 * Convex data without confirming the auth identity is actually gone.
 */
export const purgeEligibleAccounts = internalAction({
  args: {},
  returns: purgeResultValidator,
  handler: async (ctx) => {
    const candidates: { userId: Id<"users">; clerkId: string }[] = await ctx.runQuery(
      internal.accountErasure.listPurgeCandidates,
      {}
    );

    const purgedUserIds: Id<"users">[] = [];
    let clerkDeleted = 0;
    let clerkSkipped = 0;

    for (const candidate of candidates) {
      const result = await deleteClerkUser(candidate.clerkId);
      if (result === "failed") {
        clerkSkipped++;
        continue;
      }
      clerkDeleted++;

      await ctx.runMutation(internal.accountErasure.purgeUserRecord, { userId: candidate.userId });
      purgedUserIds.push(candidate.userId);
    }

    return { processed: purgedUserIds.length, purgedUserIds, clerkDeleted, clerkSkipped };
  },
});
