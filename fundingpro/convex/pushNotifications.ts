"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const sendResultValidator = v.object({
  sent: v.number(),
  failed: v.number(),
});

type SendResult = { sent: number; failed: number };

type PushTokenRow = {
  id: Id<"pushTokens">;
  token: string;
  platform: "ios" | "android";
  updatedAt: number;
};

type ExpoPushTicket = { status?: string };

export const sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.record(v.string(), v.string())),
  },
  returns: sendResultValidator,
  handler: async (ctx, args): Promise<SendResult> => {
    const tokens: PushTokenRow[] = await ctx.runQuery(internal.pushTokens.listForUser, {
      userId: args.userId,
    });

    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const messages = tokens.map((row) => ({
      to: row.token,
      title: args.title,
      body: args.body,
      data: args.data,
      sound: "default" as const,
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Expo push API error:", response.status, text);
        return { sent: 0, failed: tokens.length };
      }

      const payload = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = payload.data ?? [];
      let sent = 0;
      let failed = 0;
      for (const ticket of tickets) {
        if (ticket.status === "ok") sent++;
        else failed++;
      }
      return { sent, failed };
    } catch (error) {
      console.error("Expo push request failed:", error);
      return { sent: 0, failed: tokens.length };
    }
  },
});
