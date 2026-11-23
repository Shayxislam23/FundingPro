/**
 * FundingPro Telegram bot — pure update handler (all I/O injected, unit-tested).
 *
 * Flow: /start → language → menu → grants by audience | «Мой путь» | заявка под ключ
 * (type → share own phone via Telegram contact button = verified number + consent) → serviceRequests.
 */
import type { InlineButton, ReplyMarkup, TelegramClient } from "./api";
import { escapeHtml } from "./api";
import { botTexts, type BotTexts } from "./texts";

export type BotLocale = "ru" | "uz";

export type TgUser = { id: number; first_name?: string; last_name?: string; language_code?: string };
export type TgUpdate = {
  update_id?: number;
  message?: {
    chat: { id: number; type: string };
    from?: TgUser;
    text?: string;
    contact?: { phone_number: string; first_name?: string; last_name?: string; user_id?: number };
  };
  callback_query?: {
    id: string;
    from: TgUser;
    data?: string;
    message?: { chat: { id: number; type: string } };
  };
};

export type ChatState = { locale: BotLocale; pendingApplicantType: string | null; lastRequestAt: number | null };

export type BotGrant = { id: string; title: string; deadline: string | null };

export type BotDeps = {
  tg: TelegramClient;
  appUrl: string;
  getChat: (chatId: string) => Promise<ChatState | null>;
  saveChat: (chatId: string, patch: Partial<ChatState>) => Promise<void>;
  listGrants: (applicantType: string) => Promise<{ grants: BotGrant[]; total: number }>;
  createRequest: (input: {
    fullName: string;
    phone: string;
    applicantType: string;
    preferredLanguage: BotLocale;
  }) => Promise<{ duplicate: boolean }>;
  notifySales: (text: string) => Promise<void>;
  now?: () => number;
};

const AUDIENCES = ["business", "startup", "individual", "ngo"] as const;
const REQUEST_TYPES = ["business", "startup", "ngo", "individual"] as const;
const REQUEST_COOLDOWN_MS = 60_000;

function withLang(url: string, locale: BotLocale): string {
  if (locale === "ru") return url;
  return `${url}${url.includes("?") ? "&" : "?"}lang=uz`;
}

function langKeyboard(): ReplyMarkup {
  return { inline_keyboard: [[{ text: "Русский", callback_data: "lang:ru" }, { text: "O‘zbekcha", callback_data: "lang:uz" }]] };
}

function menuKeyboard(t: BotTexts, locale: BotLocale, appUrl: string): ReplyMarkup {
  const rows: InlineButton[][] = [
    [{ text: t.menu.business, callback_data: "g:business" }],
    [{ text: t.menu.startup, callback_data: "g:startup" }],
    [{ text: t.menu.individual, callback_data: "g:individual" }],
    [{ text: t.menu.ngo, callback_data: "g:ngo" }],
    [{ text: t.menu.lab, callback_data: "lab" }],
    [{ text: t.menu.request, callback_data: "req" }],
    [
      { text: t.menu.site, url: withLang(appUrl, locale) },
      { text: t.menu.language, callback_data: "langmenu" },
    ],
  ];
  return { inline_keyboard: rows };
}

function backRow(t: BotTexts): InlineButton[] {
  return [{ text: t.back, callback_data: "menu" }];
}

function formatDeadline(iso: string | null, locale: BotLocale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return ` · ${botTexts(locale).deadline} ${dd}.${mm}.${d.getUTCFullYear()}`;
}

function maskPhone(phone: string): string {
  return phone.length <= 6 ? "***" : `${phone.slice(0, 6)}${"*".repeat(Math.max(0, phone.length - 8))}${phone.slice(-2)}`;
}

function normalizeTelegramPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `+${digits}`;
}

function guessLocale(user?: TgUser): BotLocale {
  return user?.language_code === "uz" ? "uz" : "ru";
}

async function showMenu(deps: BotDeps, chatId: string, locale: BotLocale) {
  const t = botTexts(locale);
  await deps.tg.sendMessage(chatId, t.welcome, { replyMarkup: menuKeyboard(t, locale, deps.appUrl) });
}

async function showGrants(deps: BotDeps, chatId: string, locale: BotLocale, audience: string) {
  const t = botTexts(locale);
  const { grants, total } = await deps.listGrants(audience);
  const catalogUrl = withLang(`${deps.appUrl}/grants?for=${audience}`, locale);
  if (grants.length === 0) {
    await deps.tg.sendMessage(chatId, t.noGrants, {
      replyMarkup: { inline_keyboard: [[{ text: t.menu.request, callback_data: "req" }], backRow(t)] },
    });
    return;
  }
  const lines = grants.slice(0, 5).map((g, i) => {
    const url = withLang(`${deps.appUrl}/grants/${encodeURIComponent(g.id)}`, locale);
    return `${i + 1}. <a href="${escapeHtml(url)}">${escapeHtml(g.title)}</a>${formatDeadline(g.deadline, locale)}`;
  });
  await deps.tg.sendMessage(chatId, `${t.grantsTitle(total)}\n\n${lines.join("\n")}`, {
    replyMarkup: {
      inline_keyboard: [[{ text: t.more, url: catalogUrl }], [{ text: t.menu.request, callback_data: "req" }], backRow(t)],
    },
  });
}

async function handleCallback(deps: BotDeps, cq: NonNullable<TgUpdate["callback_query"]>) {
  await deps.tg.answerCallback(cq.id).catch(() => undefined);
  const chat = cq.message?.chat;
  if (!chat || chat.type !== "private") return;
  const chatId = String(chat.id);
  const data = cq.data ?? "";
  const state = await deps.getChat(chatId);
  const locale: BotLocale = state?.locale ?? guessLocale(cq.from);
  const t = botTexts(locale);

  if (data === "lang:ru" || data === "lang:uz") {
    const next = data.slice(5) as BotLocale;
    await deps.saveChat(chatId, { locale: next });
    await showMenu(deps, chatId, next);
    return;
  }
  if (data === "langmenu") {
    await deps.tg.sendMessage(chatId, t.chooseLang, { replyMarkup: langKeyboard() });
    return;
  }
  if (data === "menu") {
    await showMenu(deps, chatId, locale);
    return;
  }
  if (data.startsWith("g:")) {
    const audience = data.slice(2);
    if ((AUDIENCES as readonly string[]).includes(audience)) await showGrants(deps, chatId, locale, audience);
    return;
  }
  if (data === "lab") {
    await deps.tg.sendMessage(chatId, t.lab, {
      replyMarkup: { inline_keyboard: [[{ text: t.labCta, url: `${deps.appUrl}/dashboard/lab/start` }], backRow(t)] },
    });
    return;
  }
  if (data === "req") {
    await deps.tg.sendMessage(chatId, t.requestIntro, {
      replyMarkup: {
        inline_keyboard: [
          ...REQUEST_TYPES.map((k) => [{ text: t.types[k], callback_data: `rt:${k}` }]),
          backRow(t),
        ],
      },
    });
    return;
  }
  if (data.startsWith("rt:")) {
    const type = data.slice(3);
    if (!(REQUEST_TYPES as readonly string[]).includes(type)) return;
    await deps.saveChat(chatId, { pendingApplicantType: type });
    await deps.tg.sendMessage(chatId, t.askContact, {
      replyMarkup: {
        keyboard: [[{ text: t.shareContact, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
}

async function handleMessage(deps: BotDeps, msg: NonNullable<TgUpdate["message"]>) {
  // Setup helper: "/chatid" in the sales group prints the id for TELEGRAM_SALES_CHAT_ID.
  if ((msg.text ?? "").trim().split("@")[0] === "/chatid") {
    await deps.tg.sendMessage(String(msg.chat.id), `chat_id: <code>${msg.chat.id}</code>`);
    return;
  }
  if (msg.chat.type !== "private") return;
  const chatId = String(msg.chat.id);
  const state = await deps.getChat(chatId);
  const locale: BotLocale = state?.locale ?? guessLocale(msg.from);
  const t = botTexts(locale);
  const now = (deps.now ?? Date.now)();

  if (msg.contact) {
    // Only the sender's own, Telegram-verified number counts as consent to be contacted.
    if (!msg.from || msg.contact.user_id !== msg.from.id) {
      await deps.tg.sendMessage(chatId, t.notOwnContact);
      return;
    }
    const phone = normalizeTelegramPhone(msg.contact.phone_number);
    if (!phone) {
      await deps.tg.sendMessage(chatId, t.notOwnContact);
      return;
    }
    if (state?.lastRequestAt && now - state.lastRequestAt < REQUEST_COOLDOWN_MS) {
      await deps.tg.sendMessage(chatId, t.requestDuplicate, { replyMarkup: { remove_keyboard: true } });
      return;
    }
    const applicantType = state?.pendingApplicantType ?? "business";
    const fullName =
      [msg.contact.first_name ?? msg.from.first_name, msg.contact.last_name ?? msg.from.last_name]
        .filter(Boolean)
        .join(" ")
        .slice(0, 120) || "Telegram";
    try {
      const res = await deps.createRequest({ fullName, phone, applicantType, preferredLanguage: locale });
      await deps.saveChat(chatId, { pendingApplicantType: null, lastRequestAt: now });
      await deps.tg.sendMessage(chatId, res.duplicate ? t.requestDuplicate : t.requestDone, {
        replyMarkup: { remove_keyboard: true },
      });
      if (!res.duplicate) {
        const typeLabel = botTexts("ru").types[applicantType as keyof BotTexts["types"]] ?? applicantType;
        await deps
          .notifySales(
            `🆕 Заявка под ключ из Telegram\nТип: ${escapeHtml(typeLabel)}\nТелефон: ${maskPhone(phone)}\nЯзык: ${locale}\nОткрыть: ${deps.appUrl}/admin/service-requests`
          )
          .catch(() => undefined);
      }
      await showMenu(deps, chatId, locale);
    } catch {
      await deps.tg.sendMessage(chatId, t.requestFailed, { replyMarkup: { remove_keyboard: true } });
    }
    return;
  }

  const text = (msg.text ?? "").trim();
  if (text === "/start" || text.startsWith("/start ")) {
    if (!state) await deps.saveChat(chatId, { locale });
    await deps.tg.sendMessage(chatId, botTexts(locale).chooseLang, { replyMarkup: langKeyboard() });
    return;
  }
  if (text === "/menu") {
    await showMenu(deps, chatId, locale);
    return;
  }
  if (text === "/lang") {
    await deps.tg.sendMessage(chatId, t.chooseLang, { replyMarkup: langKeyboard() });
    return;
  }
  await deps.tg.sendMessage(chatId, t.unknown, { replyMarkup: menuKeyboard(t, locale, deps.appUrl) });
}

export async function handleUpdate(update: TgUpdate, deps: BotDeps): Promise<void> {
  if (update.callback_query) return handleCallback(deps, update.callback_query);
  if (update.message) return handleMessage(deps, update.message);
}
