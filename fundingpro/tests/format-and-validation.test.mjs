import { test } from "node:test";
import assert from "node:assert/strict";

function formatGrantAmount(min, max) {
  if (min == null && max == null) return undefined;
  if (max != null && min != null && min !== max) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  }
  if (max != null) return `до $${max.toLocaleString()}`;
  if (min != null) return `от $${min.toLocaleString()}`;
  return undefined;
}

function formatPlanPrice(priceUsd) {
  return priceUsd >= 500 ? `$${priceUsd}+` : `$${priceUsd}`;
}

function validateProposalContent(content) {
  const trimmed = content.trim();
  if (!trimmed) return { valid: false, reason: "empty_output", isMock: false };
  if (trimmed.length < 80) return { valid: false, reason: "too_short", isMock: false };
  const isMock = trimmed.startsWith("[AI модуль работает в тестовом режиме]");
  return { valid: true, isMock };
}

function getDeadlineUrgency(deadline) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "normal";
}

test("formatGrantAmount", () => {
  assert.equal(formatGrantAmount(null, 50000), "до $50,000");
  assert.equal(formatGrantAmount(10000, null), "от $10,000");
  assert.equal(formatGrantAmount(10000, 50000), "$10,000 – $50,000");
  assert.equal(formatGrantAmount(null, null), undefined);
});

test("formatPlanPrice", () => {
  assert.equal(formatPlanPrice(30), "$30");
  assert.equal(formatPlanPrice(500), "$500+");
});

function formatPlanPriceUzs(priceUzs) {
  if (!priceUzs || priceUzs <= 0) return "";
  return `${priceUzs.toLocaleString("ru-RU")} сум`;
}

test("formatPlanPriceUzs", () => {
  assert.equal(formatPlanPriceUzs(384000), "384 000 сум");
  assert.equal(formatPlanPriceUzs(0), "");
});

test("AI output validation", () => {
  assert.equal(validateProposalContent("").valid, false);
  assert.equal(validateProposalContent("x".repeat(100)).valid, true);
  const mock = "[AI модуль работает в тестовом режиме]\n\n" + "x".repeat(80);
  assert.equal(validateProposalContent(mock).isMock, true);
});

test("deadline urgency", () => {
  const soon = new Date();
  soon.setDate(soon.getDate() + 5);
  assert.equal(getDeadlineUrgency(soon.toISOString()), "urgent");
});
