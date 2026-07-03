import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

// Import the real module (tsx loader) so the tests cover production patterns,
// not a copy that can silently drift from lib/ai-gateway.ts.
import { redactPii, callAi, AiUnavailableError } from "../lib/ai-gateway.ts";

describe("AI PII redaction", () => {
  it("redacts email addresses", () => {
    const { redacted, fieldsFound } = redactPii("Contact: user@example.com for details");
    assert.ok(!redacted.includes("user@example.com"));
    assert.ok(fieldsFound.includes("email"));
  });

  it("redacts Uzbek phone numbers in common formats", () => {
    for (const phone of ["+998 90 123 45 67", "+998901234567", "998 90 123-45-67"]) {
      const { redacted, fieldsFound } = redactPii(`Тел: ${phone}`);
      assert.ok(!redacted.includes(phone), `expected "${phone}" to be redacted`);
      assert.ok(fieldsFound.includes("phone"));
    }
  });

  it("redacts international phone numbers with explicit plus", () => {
    const { redacted, fieldsFound } = redactPii("Call +14155552671 now");
    assert.ok(!redacted.includes("+14155552671"));
    assert.ok(fieldsFound.includes("phone_intl"));
  });

  it("redacts PINFL and passport identifiers", () => {
    const { redacted } = redactPii("PINFL: 12345678901234, паспорт AB1234567");
    assert.ok(!redacted.includes("12345678901234"));
    assert.ok(!redacted.includes("AB1234567"));
  });

  it("preserves budgets, amounts and deadlines", () => {
    const input =
      "Бюджет проекта: 250 000 USD, софинансирование 1 500 000 сум, дедлайн 2026-09-30, охват 10 000 человек";
    const { redacted, fieldsFound } = redactPii(input);
    assert.equal(redacted, input);
    assert.equal(fieldsFound.length, 0);
  });

  it("leaves non-PII text unchanged", () => {
    const input = "НКО с опытом в экологии более 3 лет";
    const { redacted, fieldsFound } = redactPii(input);
    assert.equal(redacted, input);
    assert.equal(fieldsFound.length, 0);
  });
});

describe("callAi strict mode", () => {
  const savedEnv = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
  const savedFetch = globalThis.fetch;

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.fetch = savedFetch;
  });

  it("throws AiUnavailableError when no provider is configured", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(
      callAi("test prompt", { module: "test", strict: true }),
      AiUnavailableError
    );
  });

  it("throws AiUnavailableError on provider failure instead of returning mock", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    globalThis.fetch = async () => ({ ok: false, text: async () => "boom" });
    await assert.rejects(
      callAi("test prompt", { module: "test", strict: true }),
      AiUnavailableError
    );
  });

  it("falls back to mock without strict mode", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    globalThis.fetch = async () => ({ ok: false, text: async () => "boom" });
    const result = await callAi("test prompt", { module: "test" });
    assert.equal(result.isMock, true);
    assert.equal(result.provider, "mock");
  });
});
