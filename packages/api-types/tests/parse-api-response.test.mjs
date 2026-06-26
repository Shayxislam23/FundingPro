import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { parseApiResponse } from "../src/index.ts";

const dataSchema = z.object({ id: z.string(), name: z.string() });

test("parseApiResponse returns data on success envelope", () => {
  const json = {
    success: true,
    data: { id: "g1", name: "Grant A" },
  };
  const result = parseApiResponse(json, dataSchema);
  assert.deepEqual(result, { id: "g1", name: "Grant A" });
});

test("parseApiResponse throws API error message", () => {
  const json = {
    success: false,
    error: { code: "UNAUTHORIZED", message: "Not signed in" },
  };
  assert.throws(
    () => parseApiResponse(json, dataSchema),
    /UNAUTHORIZED: Not signed in/
  );
});

test("parseApiResponse throws on invalid envelope", () => {
  assert.throws(() => parseApiResponse({ foo: 1 }, dataSchema), /Invalid API response/);
});
