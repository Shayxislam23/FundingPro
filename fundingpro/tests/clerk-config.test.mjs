import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  isClerkConfigured,
  isClerkPublishableConfigured,
} from "../lib/auth/clerk-config.ts";

describe("clerk-config placeholders", () => {
  const prevPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const prevSk = process.env.CLERK_SECRET_KEY;

  after(() => {
    if (prevPk === undefined) delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = prevPk;
    if (prevSk === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = prevSk;
  });

  function setKeys(pk, sk) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk;
    process.env.CLERK_SECRET_KEY = sk;
  }

  it("rejects REPLACE_ME / short stubs", () => {
    setKeys("pk_test_REPLACE_ME", "sk_test_REPLACE_ME");
    assert.equal(isClerkConfigured(), false);
    assert.equal(isClerkPublishableConfigured(), false);
  });

  it("rejects classic ellipsis placeholders", () => {
    setKeys("pk_test_...", "sk_test_...");
    assert.equal(isClerkConfigured(), false);
    assert.equal(isClerkPublishableConfigured(), false);
  });

  it("accepts longer real-looking keys", () => {
    setKeys("pk_test_" + "a".repeat(48), "sk_test_" + "b".repeat(48));
    assert.equal(isClerkConfigured(), true);
    assert.equal(isClerkPublishableConfigured(), true);
  });
});
