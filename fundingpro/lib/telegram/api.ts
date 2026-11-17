/** Minimal Telegram Bot API client (sendMessage / answerCallbackQuery / setWebhook). */

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type ReplyMarkup =
  | { inline_keyboard: InlineButton[][] }
  | { keyboard: { text: string; request_contact?: boolean }[][]; resize_keyboard?: boolean; one_time_keyboard?: boolean }
  | { remove_keyboard: true };

export type SendOptions = {
  replyMarkup?: ReplyMarkup;
  disablePreview?: boolean;
};

export type TelegramClient = {
  sendMessage: (chatId: string, text: string, opts?: SendOptions) => Promise<void>;
  answerCallback: (callbackId: string) => Promise<void>;
};

type FetchLike = (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export function createTelegramClient(token: string, fetchImpl: FetchLike = fetch): TelegramClient {
  const call = async (method: string, payload: Record<string, unknown>) => {
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Never log the token or message text (may contain personal data).
      throw new Error(`Telegram ${method} failed: HTTP ${res.status}`);
    }
  };
  return {
    sendMessage: (chatId, text, opts = {}) =>
      call("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: opts.disablePreview ?? true,
        ...(opts.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
      }),
    answerCallback: (callbackId) => call("answerCallbackQuery", { callback_query_id: callbackId }),
  };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Constant-time compare for the webhook secret header. */
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
