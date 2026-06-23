import { withDatabase } from "@/lib/db/runtime";

export type PlanRow = {
  id: string;
  name: string;
  nameRu: string;
  targetType: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
};

const HIGHLIGHTED_PLAN_IDS = new Set(["plan-ngo-pro", "plan-business-pro"]);

function mapPlan(row: {
  id: string;
  name: string;
  name_ru: string | null;
  target_type: string;
  price_usd: number | string;
  price_uzs?: number | string | null;
  features: unknown;
}): PlanRow {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features.map(String);
  } else if (typeof row.features === "string") {
    try {
      features = JSON.parse(row.features) as string[];
    } catch {
      features = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    nameRu: row.name_ru ?? row.name,
    targetType: row.target_type,
    priceUsd: Number(row.price_usd),
    priceUzs: Number(row.price_uzs ?? 0),
    features,
    highlighted: HIGHLIGHTED_PLAN_IDS.has(row.id),
  };
}

export async function listPlans(): Promise<PlanRow[]> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT id, name, name_ru, target_type, price_usd, price_uzs, features
         FROM plans
         WHERE is_active = true
         ORDER BY price_usd ASC`
      );
      return result.rows.map((row) =>
        mapPlan({
          id: String(row.id),
          name: String(row.name),
          name_ru: row.name_ru ? String(row.name_ru) : null,
          target_type: String(row.target_type),
          price_usd: row.price_usd,
          price_uzs: row.price_uzs,
          features: row.features,
        })
      );
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, name_ru, target_type, price_usd, price_uzs, features")
        .eq("is_active", true)
        .order("price_usd", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapPlan(row));
    }
  );
}

export function groupPlansByTarget(plans: PlanRow[]) {
  const ngo = plans.filter((p) => p.targetType === "NGO");
  const business = plans.filter((p) => p.targetType === "BUSINESS" || p.targetType === "ENTERPRISE");
  return { ngo, business };
}
