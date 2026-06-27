/**
 * Grant catalog types — re-exported from @fundingpro/api-types (single source of truth).
 * Zod schemas live in packages/api-types; web lib/db and mobile share inferred types.
 */
export type {
  GrantDetail,
  GrantListItem,
  GrantListParams,
  GrantRequirement,
  ListGrantsParams,
  ListGrantsResult,
} from "@fundingpro/api-types";

export {
  grantDetailSchema,
  grantListItemSchema,
  grantRequirementSchema,
  listGrantsParamsSchema,
  listGrantsResultSchema,
} from "@fundingpro/api-types";
