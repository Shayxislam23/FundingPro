import { withDatabase } from "@/lib/db/runtime";

export async function getGrantForEligibility(grantId: string) {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT title, sectors, country_scope FROM grants WHERE id = $1::uuid`,
        [grantId]
      );
      return result.rows[0] ?? null;
    },
    async (supabase) => {
      const { data } = await supabase
        .from("grants")
        .select("title, sectors, country_scope")
        .eq("id", grantId)
        .single();
      return data;
    }
  );
}

export async function saveEligibilityCheck(params: {
  userId: string;
  grantId?: string | null;
  answers: Record<string, unknown>;
  score: number;
  status: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  aiRequestId?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();

  return withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO eligibility_checks (id, user_id, grant_id, answers, score, status, strengths, gaps, next_steps, ai_request_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::jsonb, $5, $6, $7, $8, $9, $10::uuid)`,
        [
          id,
          params.userId,
          params.grantId ?? null,
          JSON.stringify(params.answers),
          params.score,
          params.status,
          params.strengths,
          params.gaps,
          params.nextSteps,
          params.aiRequestId ?? null,
        ]
      );
      return id;
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("eligibility_checks")
        .insert({
          user_id: params.userId,
          grant_id: params.grantId ?? null,
          answers: params.answers,
          score: params.score,
          status: params.status,
          strengths: params.strengths,
          gaps: params.gaps,
          next_steps: params.nextSteps,
          ai_request_id: params.aiRequestId ?? null,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return data.id;
    }
  );
}
