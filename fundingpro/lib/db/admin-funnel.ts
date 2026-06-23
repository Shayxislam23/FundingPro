import { withDatabase } from "@/lib/db/runtime";

export type ActivationFunnel = {
  totalUsers: number;
  withOrganization: number;
  eligibilityChecks: number;
  aiProposals: number;
  paidSubscriptions: number;
  conversionRates: {
    organization: number;
    eligibility: number;
    aiProposal: number;
    paid: number;
  };
  scopedToRecentSignups: boolean;
};

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getActivationFunnel(opts?: {
  last30DaysSignups?: boolean;
}): Promise<ActivationFunnel> {
  const scopedToRecentSignups = opts?.last30DaysSignups === true;
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  return withDatabase(
    async (pool) => {
      const userFilter = scopedToRecentSignups ? `WHERE created_at >= $1::timestamptz` : "";
      const userParams = scopedToRecentSignups ? [sinceIso] : [];

      const totalResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM users ${userFilter}`,
        userParams
      );
      const totalUsers = Number(totalResult.rows[0]?.total ?? 0);

      const orgJoin = scopedToRecentSignups
        ? `INNER JOIN users u ON u.id = om.user_id AND u.created_at >= $1::timestamptz`
        : "";
      const orgResult = await pool.query(
        `SELECT COUNT(DISTINCT om.user_id)::int AS total
         FROM organization_members om
         ${orgJoin}`,
        userParams
      );
      const withOrganization = Number(orgResult.rows[0]?.total ?? 0);

      const eligibilityJoin = scopedToRecentSignups
        ? `INNER JOIN users u ON u.id = ec.user_id AND u.created_at >= $1::timestamptz`
        : "";
      const eligibilityResult = await pool.query(
        `SELECT COUNT(DISTINCT ec.user_id)::int AS total
         FROM eligibility_checks ec
         ${eligibilityJoin}`,
        userParams
      );
      const eligibilityChecks = Number(eligibilityResult.rows[0]?.total ?? 0);

      const proposalJoin = scopedToRecentSignups
        ? `INNER JOIN users u ON u.id = pp.user_id AND u.created_at >= $1::timestamptz`
        : "";
      const proposalResult = await pool.query(
        `SELECT COUNT(DISTINCT pp.user_id)::int AS total
         FROM proposal_projects pp
         ${proposalJoin}`,
        userParams
      );
      const aiProposals = Number(proposalResult.rows[0]?.total ?? 0);

      const subJoin = scopedToRecentSignups
        ? `INNER JOIN users u ON u.id = s.user_id AND u.created_at >= $1::timestamptz`
        : "";
      const subResult = await pool.query(
        `SELECT COUNT(DISTINCT s.user_id)::int AS total
         FROM subscriptions s
         ${subJoin}
         WHERE s.status = 'ACTIVE'`,
        userParams
      );
      const paidSubscriptions = Number(subResult.rows[0]?.total ?? 0);

      return buildFunnel({
        totalUsers,
        withOrganization,
        eligibilityChecks,
        aiProposals,
        paidSubscriptions,
        scopedToRecentSignups,
      });
    },
    async (supabase) => {
      let usersQuery = supabase.from("users").select("id", { count: "exact", head: true });
      if (scopedToRecentSignups) usersQuery = usersQuery.gte("created_at", sinceIso);
      const { count: totalUsers } = await usersQuery;

      const { data: userRows } = scopedToRecentSignups
        ? await supabase.from("users").select("id").gte("created_at", sinceIso)
        : await supabase.from("users").select("id");
      const userIds = (userRows ?? []).map((u) => u.id);

      const countDistinct = async (table: string, userIdColumn = "user_id"): Promise<number> => {
        let q = supabase.from(table).select(userIdColumn);
        if (scopedToRecentSignups && userIds.length > 0) {
          q = q.in(userIdColumn, userIds);
        } else if (scopedToRecentSignups) {
          return 0;
        }
        const { data, error } = await q;
        if (error) {
          if (error.code === "42P01") return 0;
          throw new Error(error.message);
        }
        return new Set(
          (data ?? []).map((r) => String((r as unknown as Record<string, string>)[userIdColumn]))
        ).size;
      };

      const [withOrganization, eligibilityChecks, aiProposals] = await Promise.all([
        countDistinct("organization_members"),
        countDistinct("eligibility_checks"),
        countDistinct("proposal_projects"),
      ]);

      let paidQuery = supabase
        .from("subscriptions")
        .select("user_id")
        .eq("status", "ACTIVE");
      if (scopedToRecentSignups && userIds.length > 0) {
        paidQuery = paidQuery.in("user_id", userIds);
      } else if (scopedToRecentSignups) {
        return buildFunnel({
          totalUsers: 0,
          withOrganization: 0,
          eligibilityChecks: 0,
          aiProposals: 0,
          paidSubscriptions: 0,
          scopedToRecentSignups,
        });
      }
      const { data: paidRows, error: paidError } = await paidQuery;
      if (paidError && paidError.code !== "42P01") throw new Error(paidError.message);
      const paidSubscriptions = new Set((paidRows ?? []).map((r) => r.user_id)).size;

      return buildFunnel({
        totalUsers: totalUsers ?? 0,
        withOrganization,
        eligibilityChecks,
        aiProposals,
        paidSubscriptions,
        scopedToRecentSignups,
      });
    }
  );
}

function buildFunnel(input: {
  totalUsers: number;
  withOrganization: number;
  eligibilityChecks: number;
  aiProposals: number;
  paidSubscriptions: number;
  scopedToRecentSignups: boolean;
}): ActivationFunnel {
  return {
    totalUsers: input.totalUsers,
    withOrganization: input.withOrganization,
    eligibilityChecks: input.eligibilityChecks,
    aiProposals: input.aiProposals,
    paidSubscriptions: input.paidSubscriptions,
    conversionRates: {
      organization: pct(input.withOrganization, input.totalUsers),
      eligibility: pct(input.eligibilityChecks, input.totalUsers),
      aiProposal: pct(input.aiProposals, input.totalUsers),
      paid: pct(input.paidSubscriptions, input.totalUsers),
    },
    scopedToRecentSignups: input.scopedToRecentSignups,
  };
}
