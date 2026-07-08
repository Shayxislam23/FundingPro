import { v } from "convex/values";
import { internalQuery, query, type QueryCtx } from "./_generated/server";
import { adminQuery } from "./lib/customFunctions";

/** Keys safe to expose without authentication (legal copy, public disclaimers). */
const PUBLIC_SETTING_KEYS = new Set(["appDisclaimer"]);

async function readSettingByKey(ctx: QueryCtx, key: string): Promise<string | null> {
  const row = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return row?.value ?? null;
}

/** Public allowlist — no auth; only non-sensitive keys. */
export const getPublicByKey = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    if (!PUBLIC_SETTING_KEYS.has(args.key)) {
      return null;
    }
    return await readSettingByKey(ctx, args.key);
  },
});

/** Admin-only — full settings table access by key. */
export const getByKey = adminQuery({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await readSettingByKey(ctx, args.key);
  },
});

/** Server-only (Next.js webhooks / integration status) — requires CONVEX_DEPLOY_KEY. */
export const getByKeyInternal = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await readSettingByKey(ctx, args.key);
  },
});
