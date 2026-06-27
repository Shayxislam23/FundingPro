/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountErasure from "../accountErasure.js";
import type * as adminGrants from "../adminGrants.js";
import type * as adminStats from "../adminStats.js";
import type * as applications from "../applications.js";
import type * as audit from "../audit.js";
import type * as consents from "../consents.js";
import type * as consultants from "../consultants.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as donors from "../donors.js";
import type * as e2eTest from "../e2eTest.js";
import type * as eligibility from "../eligibility.js";
import type * as grants from "../grants.js";
import type * as importData from "../importData.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_paymentHelpers from "../lib/paymentHelpers.js";
import type * as lib_validators from "../lib/validators.js";
import type * as matchGrants from "../matchGrants.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as payments from "../payments.js";
import type * as paymentsInternal from "../paymentsInternal.js";
import type * as paymentsSystem from "../paymentsSystem.js";
import type * as planUsage from "../planUsage.js";
import type * as plans from "../plans.js";
import type * as platformStats from "../platformStats.js";
import type * as proposals from "../proposals.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushTokens from "../pushTokens.js";
import type * as rateLimits from "../rateLimits.js";
import type * as savedGrants from "../savedGrants.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as subscriptionRequests from "../subscriptionRequests.js";
import type * as support from "../support.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountErasure: typeof accountErasure;
  adminGrants: typeof adminGrants;
  adminStats: typeof adminStats;
  applications: typeof applications;
  audit: typeof audit;
  consents: typeof consents;
  consultants: typeof consultants;
  crons: typeof crons;
  documents: typeof documents;
  donors: typeof donors;
  e2eTest: typeof e2eTest;
  eligibility: typeof eligibility;
  grants: typeof grants;
  importData: typeof importData;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/paymentHelpers": typeof lib_paymentHelpers;
  "lib/validators": typeof lib_validators;
  matchGrants: typeof matchGrants;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  payments: typeof payments;
  paymentsInternal: typeof paymentsInternal;
  paymentsSystem: typeof paymentsSystem;
  planUsage: typeof planUsage;
  plans: typeof plans;
  platformStats: typeof platformStats;
  proposals: typeof proposals;
  pushNotifications: typeof pushNotifications;
  pushTokens: typeof pushTokens;
  rateLimits: typeof rateLimits;
  savedGrants: typeof savedGrants;
  seed: typeof seed;
  seedData: typeof seedData;
  settings: typeof settings;
  subscriptionRequests: typeof subscriptionRequests;
  support: typeof support;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
