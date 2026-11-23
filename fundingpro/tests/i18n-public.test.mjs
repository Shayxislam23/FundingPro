import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveLocale, withLang } from "../lib/i18n/locale.ts";
import { getPublicDict, REGION_LABELS_UZ } from "../lib/i18n/public-dict.ts";
import { UZ_REGIONS } from "../lib/service-requests.ts";

function shape(value, path = "") {
  if (typeof value === "function") return [`${path}:fn`];
  if (Array.isArray(value)) return [`${path}:array${value.length}`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === "object") return Object.keys(value).sort().flatMap((k) => shape(value[k], `${path}.${k}`));
  return [`${path}:${typeof value}`];
}

function strings(value) {
  if (typeof value === "function") return [value(3, 7)];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return typeof value === "string" ? [value] : [];
}

describe("public i18n", () => {
  it("resolves locale: query > cookie > ru", () => {
    assert.equal(resolveLocale("uz", "ru"), "uz");
    assert.equal(resolveLocale(undefined, "uz"), "uz");
    assert.equal(resolveLocale("de", undefined), "ru");
    assert.equal(resolveLocale(["uz"], null), "uz");
  });

  it("adds lang only for Uzbek links", () => {
    assert.equal(withLang("/grants", "ru"), "/grants");
    assert.equal(withLang("/grants", "uz"), "/grants?lang=uz");
    assert.equal(withLang("/grants?for=ngo", "uz"), "/grants?for=ngo&lang=uz");
  });

  it("Uzbek dictionary has exactly the same structure as Russian", () => {
    assert.deepEqual(shape(getPublicDict("uz")), shape(getPublicDict("ru")));
  });

  it("Uzbek copy is fully translated (no Cyrillic, no empty strings)", () => {
    const leftovers = strings(getPublicDict("uz")).filter((s) => !s.trim() || /[А-Яа-яЁё]/.test(s));
    assert.deepEqual(leftovers, []);
  });

  it("every region has an Uzbek label", () => {
    for (const r of UZ_REGIONS) assert.ok(REGION_LABELS_UZ[r], r);
  });

  it("keeps the production content-check marker in Russian", () => {
    assert.equal(getPublicDict("ru").trust.audience, "Для бизнеса и молодёжи Узбекистана");
  });
});
