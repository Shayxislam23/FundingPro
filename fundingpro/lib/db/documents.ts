import type { SupabaseClient } from "@supabase/supabase-js";
import { withUserOrAdminDatabase } from "@/lib/db/runtime";

export const DOCUMENT_TYPES = [
  "REG_CERT",
  "CHARTER",
  "TAX_CERT",
  "BANK_DETAILS",
  "CV",
  "SUPPORT_LETTER",
  "PORTFOLIO",
  "FIN_REPORT",
  "PROPOSAL_DRAFT",
  "BUDGET",
  "OTHER",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type DocumentRow = {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_key: string;
  doc_type: string;
  status: string;
  created_at: string;
};

export async function listUserDocuments(
  userId: string,
  accessToken?: string | null
): Promise<DocumentRow[]> {
  return withUserOrAdminDatabase(
    accessToken,
    async (pool) => {
      const result = await pool.query(
        `SELECT id, file_name, mime_type, size_bytes, storage_key, doc_type, status, created_at
         FROM documents
         WHERE user_id = $1::uuid AND status = 'active'
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows.map(mapRow);
    },
    async (supabase) => listDocumentsSupabase(supabase, userId)
  );
}

async function listDocumentsSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, storage_key, doc_type, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }
  return (data ?? []) as DocumentRow[];
}

export async function insertDocument(
  params: {
    userId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    docType: string;
  },
  accessToken?: string | null
): Promise<string> {
  const docType = DOCUMENT_TYPES.includes(params.docType as DocumentType)
    ? params.docType
    : "OTHER";

  return withUserOrAdminDatabase(
    accessToken,
    async (pool) => {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO documents (id, user_id, file_name, mime_type, size_bytes, storage_key, doc_type, status)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, 'active')`,
        [
          id,
          params.userId,
          params.fileName,
          params.mimeType,
          params.sizeBytes,
          params.storageKey,
          docType,
        ]
      );
      return id;
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: params.userId,
          file_name: params.fileName,
          mime_type: params.mimeType,
          size_bytes: params.sizeBytes,
          storage_key: params.storageKey,
          doc_type: docType,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return data.id;
    }
  );
}

export async function getDocumentById(
  userId: string,
  docId: string,
  accessToken?: string | null
): Promise<DocumentRow | null> {
  return withUserOrAdminDatabase(
    accessToken,
    async (pool) => {
      const result = await pool.query(
        `SELECT id, file_name, mime_type, size_bytes, storage_key, doc_type, status, created_at
         FROM documents
         WHERE id = $1::uuid AND user_id = $2::uuid AND status = 'active'`,
        [docId, userId]
      );
      const row = result.rows[0];
      return row ? mapRow(row) : null;
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, mime_type, size_bytes, storage_key, doc_type, status, created_at")
        .eq("id", docId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as DocumentRow | null;
    }
  );
}

export async function softDeleteDocument(
  userId: string,
  docId: string,
  accessToken?: string | null
): Promise<boolean> {
  return withUserOrAdminDatabase(
    accessToken,
    async (pool) => {
      const result = await pool.query(
        `UPDATE documents SET status = 'deleted', updated_at = now()
         WHERE id = $1::uuid AND user_id = $2::uuid AND status = 'active'
         RETURNING id`,
        [docId, userId]
      );
      return (result.rowCount ?? 0) > 0;
    },
    async (supabase) => {
      const { data: doc, error: fetchErr } = await supabase
        .from("documents")
        .select("id, user_id")
        .eq("id", docId)
        .single();

      if (fetchErr || !doc || doc.user_id !== userId) return false;

      const { error } = await supabase
        .from("documents")
        .update({ status: "deleted" })
        .eq("id", docId);
      if (error) throw new Error(error.message);
      return true;
    }
  );
}

function mapRow(r: Record<string, unknown>): DocumentRow {
  return {
    id: String(r.id),
    file_name: String(r.file_name),
    mime_type: r.mime_type ? String(r.mime_type) : null,
    size_bytes: r.size_bytes != null ? Number(r.size_bytes) : null,
    storage_key: String(r.storage_key),
    doc_type: String(r.doc_type ?? "OTHER"),
    status: String(r.status),
    created_at: new Date(String(r.created_at)).toISOString(),
  };
}
