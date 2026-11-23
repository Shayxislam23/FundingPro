/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("telegram chat state is created, patched and cleared", async () => {
  const t = convexTest(schema, modules);
  expect(await t.query(internal.telegram.getChat, { chatId: "42" })).toBeNull();
  await t.mutation(internal.telegram.upsertChat, { chatId: "42", locale: "uz" });
  await t.mutation(internal.telegram.upsertChat, { chatId: "42", pendingApplicantType: "startup" });
  expect(await t.query(internal.telegram.getChat, { chatId: "42" })).toEqual({
    chatId: "42",
    locale: "uz",
    pendingApplicantType: "startup",
    lastRequestAt: null,
  });
  await t.mutation(internal.telegram.upsertChat, { chatId: "42", pendingApplicantType: null, lastRequestAt: 5 });
  expect(await t.query(internal.telegram.getChat, { chatId: "42" })).toMatchObject({
    locale: "uz",
    pendingApplicantType: null,
    lastRequestAt: 5,
  });
});
