import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { resolveUserMode } from "./userMode";

type Ctx = QueryCtx | MutationCtx;

export type AppUser = Doc<"users">;

export async function getIdentity(ctx: Ctx) {
  return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: Ctx) {
  const identity = await getIdentity(ctx);
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getUserByToken(ctx: Ctx): Promise<AppUser | null> {
  const identity = await getIdentity(ctx);
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export async function getCurrentUser(ctx: Ctx): Promise<AppUser> {
  const user = await getUserByToken(ctx);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.isBanned) {
    throw new Error("Account banned");
  }
  if (!user.isActive) {
    throw new Error("Account disabled");
  }
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<AppUser> {
  const user = await getCurrentUser(ctx);
  if (user.platformRole !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function ensureUser(
  ctx: MutationCtx,
  params: {
    clerkId: string;
    tokenIdentifier: string;
    email?: string | null;
    emailVerified?: boolean;
    provider?: string;
  }
): Promise<{ user: AppUser; isNew: boolean }> {
  const now = Date.now();
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", params.clerkId))
    .unique();

  if (!existing && params.email) {
    const imported = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", params.email!))
      .unique();
    if (imported && imported.clerkId.startsWith("import:")) {
      await ctx.db.patch("users", imported._id, {
        clerkId: params.clerkId,
        tokenIdentifier: params.tokenIdentifier,
        emailVerified: params.emailVerified ?? imported.emailVerified,
        updatedAt: now,
      });

      const identity = await ctx.db
        .query("userIdentities")
        .withIndex("by_user", (q) => q.eq("userId", imported._id))
        .first();
      if (identity) {
        await ctx.db.patch("userIdentities", identity._id, {
          provider: params.provider ?? "clerk",
          providerId: params.clerkId,
          updatedAt: now,
        });
      }

      const user = await persistDefaultUserMode(ctx, (await ctx.db.get("users", imported._id))!);
      return { user, isNew: false };
    }
  }

  if (existing) {
    const patch: Partial<AppUser> = { updatedAt: now };
    if (params.email !== undefined && params.email !== existing.email) {
      patch.email = params.email ?? undefined;
    }
    if (params.emailVerified !== undefined) {
      patch.emailVerified = params.emailVerified;
    }
    if (Object.keys(patch).length > 1) {
      await ctx.db.patch("users", existing._id, patch);
    }
    const user = await persistDefaultUserMode(ctx, (await ctx.db.get("users", existing._id))!);
    return { user, isNew: false };
  }

  const userId = await ctx.db.insert("users", {
    clerkId: params.clerkId,
    tokenIdentifier: params.tokenIdentifier,
    email: params.email ?? undefined,
    emailVerified: params.emailVerified ?? false,
    isActive: true,
    isBanned: false,
    platformRole: "user",
    createdAt: now,
    updatedAt: now,
  });

  const provider = params.provider ?? "clerk";
  await ctx.db.insert("userIdentities", {
    userId,
    provider,
    providerId: params.clerkId,
    createdAt: now,
    updatedAt: now,
  });

  const user = await persistDefaultUserMode(ctx, (await ctx.db.get("users", userId))!);
  return { user, isNew: true };
}

export async function getUserByClerkId(
  ctx: Ctx,
  clerkId: string
): Promise<AppUser | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

export async function getUserByExternalId(
  ctx: Ctx,
  externalId: string
): Promise<AppUser | null> {
  const byClerk = await getUserByClerkId(ctx, externalId);
  if (byClerk) return byClerk;

  try {
    return await ctx.db.get("users", externalId as Id<"users">);
  } catch {
    return null;
  }
}

export function externalUserId(user: AppUser): string {
  return user.clerkId;
}

async function persistDefaultUserMode(
  ctx: MutationCtx,
  user: AppUser
): Promise<AppUser> {
  if (user.userMode) return user;
  const userMode = await resolveUserMode(ctx, user);
  const now = Date.now();
  await ctx.db.patch("users", user._id, { userMode, updatedAt: now });
  return (await ctx.db.get("users", user._id))!;
}
