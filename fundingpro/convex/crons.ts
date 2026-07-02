import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh platform stats",
  { minutes: 10 },
  internal.platformStats.refresh,
  {}
);

crons.interval(
  "purge accounts pending erasure",
  { hours: 24 },
  internal.accountErasure.purgeEligibleAccounts,
  {}
);

crons.interval(
  "expire subscriptions",
  { hours: 1 },
  internal.paymentsInternal.expireSubscriptions,
  {}
);

crons.interval(
  "close expired grants",
  { hours: 6 },
  internal.adminGrants.closeExpiredGrants,
  {}
);

export default crons;
