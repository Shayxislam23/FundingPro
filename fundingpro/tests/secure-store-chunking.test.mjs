import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirrors mobile/lib/secure-store-chunking.ts
const CHUNK_SIZE = 2000;

function splitSecureStoreValue(value, chunkSize = CHUNK_SIZE) {
  if (value.length <= chunkSize) return [value];
  const chunks = [];
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize));
  }
  return chunks;
}

function joinSecureStoreChunks(chunks) {
  return chunks.join("");
}

describe("secure store chunking", () => {
  it("keeps small values in one chunk", () => {
    assert.deepEqual(splitSecureStoreValue("short"), ["short"]);
  });

  it("splits oversized session JSON", () => {
    const big = "x".repeat(4500);
    const chunks = splitSecureStoreValue(big);
    assert.equal(chunks.length, 3);
    assert.equal(joinSecureStoreChunks(chunks), big);
    assert.ok(chunks.every((c) => c.length <= CHUNK_SIZE));
  });
});
