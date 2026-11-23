import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleUpdate } from "../lib/telegram/bot.ts";
import { createTelegramClient, safeEqual, escapeHtml } from "../lib/telegram/api.ts";

function harness(opts = {}) {
  const sent = [];
  const chats = new Map();
  const requests = [];
  const sales = [];
  let now = 1_800_000_000_000;
  const deps = {
    appUrl: "https://fundingpro.uz",
    tg: {
      sendMessage: async (chatId, text, o = {}) => void sent.push({ chatId, text, markup: o.replyMarkup }),
      answerCallback: async () => {},
    },
    getChat: async (id) => chats.get(id) ?? null,
    saveChat: async (id, patch) => {
      const prev = chats.get(id) ?? { locale: "ru", pendingApplicantType: null, lastRequestAt: null };
      chats.set(id, { ...prev, ...patch });
    },
    listGrants: async (type) =>
      opts.grants ?? { total: 1, grants: [{ id: "k57abc0123456789", title: `Grant for ${type} <b>`, deadline: "2027-02-15T00:00:00.000Z" }] },
    createRequest: async (input) => {
      requests.push(input);
      return { duplicate: false };
    },
    notifySales: async (text) => void sales.push(text),
    now: () => now,
  };
  return { deps, sent, chats, requests, sales, tick: (ms) => (now += ms) };
}

const user = { id: 42, first_name: "Ali", last_name: "Valiyev", language_code: "uz" };
const msg = (extra) => ({ message: { chat: { id: 42, type: "private" }, from: user, ...extra } });
const cb = (data) => ({ callback_query: { id: "q1", from: user, data, message: { chat: { id: 42, type: "private" } } } });

describe("telegram bot", () => {
  it("/start asks for a language, then shows the menu in Uzbek", async () => {
    const h = harness();
    await handleUpdate(msg({ text: "/start" }), h.deps);
    assert.match(h.sent[0].text, /Tilni tanlang/);
    await handleUpdate(cb("lang:uz"), h.deps);
    assert.equal(h.chats.get("42").locale, "uz");
    assert.match(h.sent[1].text, /O‘zbekiston biznesi/);
    const buttons = h.sent[1].markup.inline_keyboard.flat().map((b) => b.callback_data ?? b.url);
    assert.ok(buttons.includes("g:business") && buttons.includes("req") && buttons.includes("lab"));
  });

  it("lists grants with escaped titles, deadlines and localized links", async () => {
    const h = harness();
    await h.deps.saveChat("42", { locale: "uz" });
    await handleUpdate(cb("g:business"), h.deps);
    const text = h.sent[0].text;
    assert.match(text, /Grant for business &lt;b&gt;/);
    assert.match(text, /muddat 15\.02\.2027/);
    assert.match(text, /\/grants\/k57abc0123456789\?lang=uz/);
  });

  it("offers a request when no grants are open", async () => {
    const h = harness({ grants: { total: 0, grants: [] } });
    await h.deps.saveChat("42", { locale: "ru" });
    await handleUpdate(cb("g:ngo"), h.deps);
    assert.match(h.sent[0].text, /нет/);
  });

  it("full request flow: type → own contact → request + masked sales note", async () => {
    const h = harness();
    await h.deps.saveChat("42", { locale: "ru" });
    await handleUpdate(cb("req"), h.deps);
    await handleUpdate(cb("rt:startup"), h.deps);
    assert.equal(h.sent[1].markup.keyboard[0][0].request_contact, true);
    await handleUpdate(msg({ contact: { phone_number: "998901234567", first_name: "Ali", user_id: 42 } }), h.deps);
    assert.deepEqual(h.requests, [{ fullName: "Ali Valiyev", phone: "+998901234567", applicantType: "startup", preferredLanguage: "ru" }]);
    assert.match(h.sent[2].text, /Заявка принята/);
    assert.equal(h.sales.length, 1);
    assert.ok(!h.sales[0].includes("998901234567"), "sales note must not contain the full phone");
    assert.match(h.sales[0], /\+99890\*+67/);
    assert.equal(h.chats.get("42").pendingApplicantType, null);
  });

  it("picks Uzbek for a new user whose Telegram language is uz", async () => {
    const h = harness({ grants: { total: 0, grants: [] } });
    await handleUpdate(cb("g:ngo"), h.deps);
    assert.match(h.sent[0].text, /ochiq grantlar yo‘q/);
  });

  it("rejects someone else's contact", async () => {
    const h = harness();
    await handleUpdate(msg({ contact: { phone_number: "998901234567", user_id: 7 } }), h.deps);
    assert.equal(h.requests.length, 0);
    assert.match(h.sent[0].text, /свой номер|o‘z raqamingizni/);
  });

  it("does not create a second request within a minute", async () => {
    const h = harness();
    const contact = msg({ contact: { phone_number: "998901234567", user_id: 42 } });
    await handleUpdate(contact, h.deps);
    h.tick(10_000);
    await handleUpdate(contact, h.deps);
    assert.equal(h.requests.length, 1);
  });

  it("ignores group chats except /chatid", async () => {
    const h = harness();
    await handleUpdate({ message: { chat: { id: -100, type: "supergroup" }, from: user, text: "/start" } }, h.deps);
    assert.equal(h.sent.length, 0);
    await handleUpdate({ message: { chat: { id: -100, type: "supergroup" }, from: user, text: "/chatid@FundingProBot" } }, h.deps);
    assert.match(h.sent[0].text, /-100/);
  });

  it("api client posts JSON to the bot endpoint and hides the token on error", async () => {
    const calls = [];
    const client = createTelegramClient("123:SECRET", async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: false, status: 400, text: async () => "" };
    });
    await assert.rejects(client.sendMessage("1", "hi"), (err) => !String(err).includes("SECRET"));
    assert.equal(calls[0].url, "https://api.telegram.org/bot123:SECRET/sendMessage");
    assert.equal(calls[0].body.parse_mode, "HTML");
  });

  it("helpers: constant-time compare and HTML escaping", () => {
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("", ""), false);
    assert.equal(escapeHtml("<a & b>"), "&lt;a &amp; b&gt;");
  });
});
