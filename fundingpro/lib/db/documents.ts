import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import type { Id } from "../../convex/_generated/dataModel";

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
  "MOTIVATION_LETTER",
  "APPLICATION_PROOF",
  "PAYMENT_PROOF",
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
  storage_id: string | null;
  doc_type: string;
  status: string;
  created_at: string;
};

export async function listUserDocuments(accessToken: string): Promise<DocumentRow[]> {
  return convexQuery(api.documents.listForUser, {}, accessToken);
}

export async function insertDocument(
  params: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    docType: string;
    storageId?: string;
  },
  accessToken: string
): Promise<string> {
  return convexMutation(
    api.documents.insert,
    {
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      storageKey: params.storageKey,
      docType: params.docType,
      storageId: params.storageId as Id<"_storage"> | undefined,
    },
    accessToken
  );
}

export async function getDocumentDownloadUrl(
  storageId: string,
  accessToken: string
): Promise<string | null> {
  return convexQuery(
    api.documents.getDownloadUrl,
    { storageId: storageId as Id<"_storage"> },
    accessToken
  );
}

export async function getDocumentById(
  docId: string,
  accessToken: string
): Promise<DocumentRow | null> {
  return convexQuery(api.documents.getById, { docId }, accessToken);
}

export async function softDeleteDocument(
  docId: string,
  accessToken: string
): Promise<boolean> {
  return convexMutation(api.documents.softDelete, { docId }, accessToken);
}
