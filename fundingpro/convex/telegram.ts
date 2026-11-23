/** Telegram bot chat state (internal; written only by the webhook route). */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const localeValidator = v.union(v.literal("ru"), v.literal("uz"));

const chatValidator = v.union(
  v.null(),
  v.object({
    chatId: v.string(),
    locale: localeValidator,
    pendingApplicantType: v.union(v.string(), v.null()),
    lastRequestAt: v.union(v.number(), v.null()),
  })
);

export const getChat = internalQuery({
  args: { chatId: v.string() },
  returns: chatValidator,
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("telegramChats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .unique();
    if (!row) return null;
    return {
      chatId: row.chatId,
      locale: row.locale,
      pendingApplicantType: row.pendingApplicantType ?? null,
      lastRequestAt: row.lastRequestAt ?? null,
    };
  },
});

export const upsertChat = internalMutation({
  args: {
    chatId: v.string(),
    locale: v.optional(localeValidator),
    pendingApplicantType: v.optional(v.union(v.string(), v.null())),
    lastRequestAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const row = await ctx.db
      .query("telegramChats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .unique();
    if (!row) {
      await ctx.db.insert("telegramChats", {
        chatId: args.chatId,
        locale: args.locale ?? "ru",
        pendingApplicantType: args.pendingApplicantType ?? undefined,
        lastRequestAt: args.lastRequestAt,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.patch("telegramChats", row._id, {
      ...(args.locale ? { locale: args.locale } : {}),
      ...(args.pendingApplicantType !== undefined ? { pendingApplicantType: args.pendingApplicantType ?? undefined } : {}),
      ...(args.lastRequestAt !== undefined ? { lastRequestAt: args.lastRequestAt } : {}),
      updatedAt: now,
    });
    return null;
  },
});
