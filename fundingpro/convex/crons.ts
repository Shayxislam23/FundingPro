import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "purge accounts pending erasure",
  { hours: 24 },
  internal.accountErasure.purgeEligibleAccounts,
  {}
);

crons.interval(
  "refresh platform stats",
  { minutes: 10 },
  internal.platformStats.refresh,
  {}
);

export default crons;
