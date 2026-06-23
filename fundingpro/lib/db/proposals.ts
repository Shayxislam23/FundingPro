import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";

export async function logAiRequest(params: {
  userId: string;
  requestType: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  redactionApplied: boolean;
  status?: string;
}): Promise<string> {
  const id = crypto.randomUUID();

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO ai_requests (id, user_id, request_type, model, input_tokens, output_tokens, redaction_applied, status)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        params.userId,
        params.requestType,
        params.model,
        params.inputTokens ?? 0,
        params.outputTokens ?? 0,
        params.redactionApplied,
        params.status ?? "success",
      ]
    );
    return id;
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("ai_requests").insert({
    id,
    user_id: params.userId,
    request_type: params.requestType,
    model: params.model,
    input_tokens: params.inputTokens ?? 0,
    output_tokens: params.outputTokens ?? 0,
    redaction_applied: params.redactionApplied,
    status: params.status ?? "success",
  });

  if (error && error.code !== "42P01") {
    console.error("logAiRequest error:", error.message);
  }

  return id;
}

export async function saveProposalProject(params: {
  userId: string;
  title: string;
  grantId?: string | null;
  donorFormat: string;
  sections: Record<string, string>;
}): Promise<string> {
  const projectId = crypto.randomUUID();

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO proposal_projects (id, user_id, title, grant_id, donor_format, status)
       VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, 'DRAFT')`,
      [projectId, params.userId, params.title, params.grantId ?? null, params.donorFormat]
    );

    for (const [sectionType, content] of Object.entries(params.sections)) {
      await pool.query(
        `INSERT INTO proposal_sections (project_id, section_type, content)
         VALUES ($1::uuid, $2, $3)`,
        [projectId, sectionType, content]
      );
    }

    return projectId;
  }

  const supabase = createSupabaseAdmin();
  const { error: projectError } = await supabase.from("proposal_projects").insert({
    id: projectId,
    user_id: params.userId,
    title: params.title,
    grant_id: params.grantId ?? null,
    donor_format: params.donorFormat,
    status: "DRAFT",
  });

  if (projectError) {
    if (projectError.code === "42P01") return projectId;
    throw new Error(projectError.message);
  }

  const sectionRows = Object.entries(params.sections).map(([section_type, content]) => ({
    project_id: projectId,
    section_type,
    content,
  }));

  if (sectionRows.length > 0) {
    const { error: sectionsError } = await supabase.from("proposal_sections").insert(sectionRows);
    if (sectionsError && sectionsError.code !== "42P01") {
      throw new Error(sectionsError.message);
    }
  }

  return projectId;
}

export async function listProposalProjects(userId: string, limit = 10) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, title, donor_format, status, created_at, updated_at
       FROM proposal_projects
       WHERE user_id = $1::uuid
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      donorFormat: r.donor_format ? String(r.donor_format) : null,
      status: String(r.status),
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    }));
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("proposal_projects")
    .select("id, title, donor_format, status, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    donorFormat: p.donor_format,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}
