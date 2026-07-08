import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { userModeValidator } from "./validators";

/** Active product mode: физлицо first. NGO/org modes reserved for later. */
export type UserMode = "individual" | "mentor" | "admin";

export { userModeValidator };

function normalizeStoredMode(stored: Doc<"users">["userMode"]): UserMode {
  if (stored === "admin" || stored === "mentor") return stored;
  // Legacy organization / lab_student → individual experience
  return "individual";
}

export async function resolveUserMode(
  ctx: { db: QueryCtx["db"] },
  user: Doc<"users">
): Promise<UserMode> {
  if (user.platformRole === "admin") return "admin";
  if (user.userMode) return normalizeStoredMode(user.userMode);
  return "individual";
}

export async function resolveLabCohortId(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">
): Promise<Id<"labCohorts"> | undefined> {
  const enrollment = await ctx.db
    .query("labEnrollments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();
  return enrollment?.cohortId;
}

export async function patchUserMode(
  ctx: MutationCtx,
  userId: Id<"users">,
  userMode: UserMode
): Promise<void> {
  await ctx.db.patch("users", userId, {
    userMode,
    updatedAt: Date.now(),
  });
}
