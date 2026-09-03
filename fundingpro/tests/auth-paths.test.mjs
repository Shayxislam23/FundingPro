import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safePostAuthPath, signInUrl, signUpUrl } from "../lib/auth/paths.ts";

describe("safePostAuthPath", () => {
  it("allows relative app paths with query", () => {
    assert.equal(
      safePostAuthPath("/zoomrad/eligibility?channel=zoomrad&lang=ru"),
      "/zoomrad/eligibility?channel=zoomrad&lang=ru"
    );
    assert.equal(safePostAuthPath("/dashboard/subscription?plan=pro"), "/dashboard/subscription?plan=pro");
  });

  it("rejects open redirects and auth loops", () => {
    assert.equal(safePostAuthPath("https://evil.example/phish"), null);
    assert.equal(safePostAuthPath("//evil.example"), null);
    assert.equal(safePostAuthPath("/sign-in"), null);
    assert.equal(safePostAuthPath("/auth/confirm"), null);
    assert.equal(safePostAuthPath(""), null);
    assert.equal(safePostAuthPath(undefined), null);
  });

  it("signInUrl / signUpUrl encode next", () => {
    assert.equal(signInUrl("/zoomrad/welcome"), "/sign-in?next=%2Fzoomrad%2Fwelcome");
    assert.equal(signUpUrl("/dashboard"), "/sign-up?next=%2Fdashboard");
    assert.equal(signInUrl("https://evil.test"), "/sign-in");
  });
});
