import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GRANT_DETAIL_FIXTURE,
  grantDetailSchema,
  grantListItemSchema,
  listGrantsResultSchema,
} from "@fundingpro/api-types";

const GRANT_LIST_FIXTURE = {
  grants: [
    {
      id: GRANT_DETAIL_FIXTURE.id,
      title: GRANT_DETAIL_FIXTURE.title,
      title_ru: GRANT_DETAIL_FIXTURE.title_ru,
      description: GRANT_DETAIL_FIXTURE.description,
      sectors: GRANT_DETAIL_FIXTURE.sectors,
      country_scope: GRANT_DETAIL_FIXTURE.country_scope,
      amount_min: GRANT_DETAIL_FIXTURE.amount_min,
      amount_max: GRANT_DETAIL_FIXTURE.amount_max,
      deadline: GRANT_DETAIL_FIXTURE.deadline,
      donor: {
        id: GRANT_DETAIL_FIXTURE.donor.id,
        name: GRANT_DETAIL_FIXTURE.donor.name,
        name_ru: GRANT_DETAIL_FIXTURE.donor.name_ru,
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
  continueCursor: null,
  isDone: true,
};

test("listGrantsResultSchema accepts paginated grants list fixture", () => {
  const parsed = listGrantsResultSchema.safeParse(GRANT_LIST_FIXTURE);
  assert.equal(parsed.success, true);
});

test("grantListItemSchema accepts list item from seed catalog", () => {
  const parsed = grantListItemSchema.safeParse(GRANT_LIST_FIXTURE.grants[0]);
  assert.equal(parsed.success, true);
});

test("grantDetailSchema accepts wrapped API success envelope data", () => {
  const envelope = { success: true, data: GRANT_DETAIL_FIXTURE };
  const parsed = grantDetailSchema.safeParse(envelope.data);
  assert.equal(parsed.success, true, parsed.success ? undefined : JSON.stringify(parsed.error.format()));
  assert.ok(parsed.success && parsed.data.grant_requirements?.length === 1);
  assert.equal(parsed.success && parsed.data.description_ru, GRANT_DETAIL_FIXTURE.description_ru);
});
