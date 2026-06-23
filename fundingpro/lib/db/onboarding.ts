import { withDatabase } from "@/lib/db/runtime";
import { getUserOrganizationDetails } from "@/lib/db/organizations";
import { listSavedGrantIds } from "@/lib/db/saved-grants";

export type OnboardingStepId =
  | "profile"
  | "documents"
  | "saved_grant"
  | "eligibility"
  | "ai_proposal";

export type OnboardingStatus = {
  steps: Record<OnboardingStepId, boolean>;
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
};

async function countDocuments(userId: string): Promise<number> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM documents WHERE user_id = $1::uuid`,
        [userId]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
  );
}

async function countApplications(userId: string): Promise<number> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM applications WHERE user_id = $1::uuid`,
        [userId]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
  );
}

async function countEligibilityChecks(userId: string): Promise<number> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM eligibility_checks WHERE user_id = $1::uuid`,
        [userId]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("eligibility_checks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
  );
}

async function countAiProposals(userId: string): Promise<number> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM proposal_projects WHERE user_id = $1::uuid`,
        [userId]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("proposal_projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
  );
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [org, docCount, savedIds, appCount, eligibilityCount, aiCount] = await Promise.all([
    getUserOrganizationDetails(userId),
    countDocuments(userId),
    listSavedGrantIds(userId).catch(() => [] as string[]),
    countApplications(userId),
    countEligibilityChecks(userId),
    countAiProposals(userId),
  ]);

  const steps: Record<OnboardingStepId, boolean> = {
    profile: !!org,
    documents: docCount > 0,
    saved_grant: savedIds.length > 0 || appCount > 0,
    eligibility: eligibilityCount > 0,
    ai_proposal: aiCount > 0,
  };

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;

  return {
    steps,
    completedCount,
    totalSteps,
    isComplete: completedCount === totalSteps,
  };
}
