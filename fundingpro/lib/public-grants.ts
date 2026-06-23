import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import {
  listGrants,
  getGrantById,
  type GrantDetail,
  type GrantListItem,
} from "@/lib/db/grants";

export type { GrantListItem, GrantDetail };

export type PublicGrantsListParams = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  page?: number;
  limit?: number;
};

export type PublicGrantsListResult = {
  grants: GrantListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export async function listPublicGrants(
  params: PublicGrantsListParams = {}
): Promise<PublicGrantsListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(params.limit ?? 20, 100);

  if (isLocalDatabaseEnabled()) {
    return listGrants({
      search: params.search,
      sector: params.sector,
      country: params.country,
      donorId: params.donorId,
      deadlineBefore: params.deadlineBefore,
      page,
      limit,
    });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdmin();

  let query = supabase
    .from("grants")
    .select(
      `
        id,
        title,
        title_ru,
        description,
        sectors,
        country_scope,
        amount_min,
        amount_max,
        deadline,
        donor:donors ( id, name, name_ru )
      `,
      { count: "exact" }
    )
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }
  if (params.sector) {
    query = query.contains("sectors", [params.sector]);
  }
  if (params.country) {
    query = query.contains("country_scope", [params.country]);
  }
  if (params.donorId) {
    query = query.eq("donor_id", params.donorId);
  }

  const { data: grants, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    grants: (grants ?? []) as unknown as GrantListItem[],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getPublicGrantById(id: string): Promise<GrantDetail | null> {
  if (isLocalDatabaseEnabled()) {
    return getGrantById(id);
  }

  const supabase = createSupabaseAdmin();
  const { data: grant, error } = await supabase
    .from("grants")
    .select(
      `
        id,
        title,
        title_ru,
        description,
        description_ru,
        sectors,
        country_scope,
        amount_min,
        amount_max,
        deadline,
        donor:donors ( id, name, name_ru, website ),
        grant_requirements ( id, requirement_type, text, required )
      `
    )
    .eq("id", id)
    .single();

  if (error || !grant) return null;
  return grant as unknown as GrantDetail;
}
