export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { convexInternalMutation, convexInternalQuery, internal } from "@/lib/convex-server";
import { listPublicGrants } from "@/lib/public-grants";
import { createTelegramClient, safeEqual } from "@/lib/telegram/api";
import { handleUpdate, type TgUpdate } from "@/lib/telegram/bot";
import { notifySalesTelegram } from "@/lib/telegram/notify";

/**
 * POST /api/v1/telegram/webhook — Telegram Bot API webhook.
 * Authenticated by the secret_token set in setWebhook (X-Telegram-Bot-Api-Secret-Token).
 * Always answers 200 quickly so Telegram does not retry on our own errors.
 */
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token || !secret) return NextResponse.json({ ok: false }, { status: 404 });
  if (!safeEqual(req.headers.get("x-telegram-bot-api-secret-token") ?? "", secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const text = await req.text();
  if (text.length > 64_000) return NextResponse.json({ ok: true });
  let update: TgUpdate;
  try {
    update = JSON.parse(text) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz").replace(/\/$/, "");
  try {
    await handleUpdate(update, {
      tg: createTelegramClient(token),
      appUrl,
      getChat: async (chatId) => {
        const row = await convexInternalQuery(internal.telegram.getChat, { chatId });
        return row ? { locale: row.locale, pendingApplicantType: row.pendingApplicantType, lastRequestAt: row.lastRequestAt } : null;
      },
      saveChat: async (chatId, patch) => {
        await convexInternalMutation(internal.telegram.upsertChat, {
          chatId,
          ...(patch.locale ? { locale: patch.locale } : {}),
          ...(patch.pendingApplicantType !== undefined ? { pendingApplicantType: patch.pendingApplicantType } : {}),
          ...(typeof patch.lastRequestAt === "number" ? { lastRequestAt: patch.lastRequestAt } : {}),
        });
      },
      listGrants: async (applicantType) => {
        const result = await listPublicGrants({ applicantType, activeOnly: true, limit: 5, page: 1 });
        return {
          total: result.total,
          grants: result.grants.map((g) => ({ id: g.id, title: g.title_ru ?? g.title, deadline: g.deadline })),
        };
      },
      createRequest: async (input) => {
        const res = await convexInternalMutation(internal.serviceRequests.create, {
          fullName: input.fullName,
          phone: input.phone,
          applicantType: input.applicantType,
          preferredLanguage: input.preferredLanguage,
          consentTextVersion: "telegram-v1.0",
          utmSource: "telegram",
          utmMedium: "bot",
        });
        return { duplicate: res.duplicate };
      },
      notifySales: notifySalesTelegram,
    });
  } catch (err) {
    console.error("[telegram] update failed", String(err).slice(0, 160));
  }
  return NextResponse.json({ ok: true });
}
