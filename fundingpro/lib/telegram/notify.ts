import { createTelegramClient } from "./api";

/**
 * Posts a short (personal-data-masked) note to the FundingPro sales Telegram chat.
 * No-op unless TELEGRAM_BOT_TOKEN and TELEGRAM_SALES_CHAT_ID are set. Never throws.
 */
export async function notifySalesTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID?.trim();
  if (!token || !chatId) return;
  try {
    await createTelegramClient(token).sendMessage(chatId, text);
  } catch (err) {
    console.error("[telegram] sales notification failed", String(err).slice(0, 120));
  }
}
