import { describe, it } from "node:test";
import assert from "node:assert/strict";

function mapGrantRow(row) {
  const donor = row.donor ?? null;
  return {
    id: String(row.id),
    title: String(row.title),
    title_ru: row.title_ru ? String(row.title_ru) : null,
    description: row.description ? String(row.description) : null,
    sectors: row.sectors ?? [],
    country_scope: row.country_scope ?? [],
    amount_min: row.amount_min != null ? Number(row.amount_min) : null,
    amount_max: row.amount_max != null ? Number(row.amount_max) : null,
    deadline: row.deadline ? new Date(String(row.deadline)).toISOString() : null,
    donor: {
      id: donor?.id ? String(donor.id) : "",
      name: donor?.name ? String(donor.name) : "",
      name_ru: donor?.name_ru ? String(donor.name_ru) : null,
    },
  };
}

function validateListResult(result) {
  assert.ok(Array.isArray(result.grants));
  assert.equal(typeof result.total, "number");
  assert.equal(typeof result.page, "number");
  assert.equal(typeof result.limit, "number");
  assert.equal(typeof result.pages, "number");
  for (const g of result.grants) {
    assert.equal(typeof g.id, "string");
    assert.equal(typeof g.title, "string");
    assert.ok(g.donor);
  }
  return true;
}

describe("grants unified shape", () => {
  it("mapGrantRow produces GrantListItem fields", () => {
    const row = mapGrantRow({
      id: "g1",
      title: "Test Grant",
      title_ru: null,
      description: "desc",
      sectors: ["education"],
      country_scope: ["UZ"],
      amount_min: 1000,
      amount_max: 5000,
      deadline: "2026-12-31T00:00:00.000Z",
      donor: { id: "d1", name: "Donor", name_ru: null },
    });
    assert.equal(row.id, "g1");
    assert.equal(row.donor.name, "Donor");
    assert.equal(row.sectors[0], "education");
  });

  it("list result pagination shape", () => {
    const result = {
      grants: [
        mapGrantRow({
          id: "1",
          title: "A",
          sectors: [],
          country_scope: [],
          donor: { id: "d", name: "D", name_ru: null },
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    };
    assert.equal(validateListResult(result), true);
  });
});
