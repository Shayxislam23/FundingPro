import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";
import type { Id } from "./_generated/dataModel";

const DOCUMENT_TYPES = [
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

const documentRow = v.object({
  id: v.string(),
  file_name: v.string(),
  mime_type: v.union(v.string(), v.null()),
  size_bytes: v.union(v.number(), v.null()),
  storage_key: v.string(),
  storage_id: v.union(v.string(), v.null()),
  doc_type: v.string(),
  status: v.string(),
  created_at: v.string(),
});

function mapDoc(doc: {
  _id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  storageKey: string;
  storageId?: Id<"_storage">;
  docType: string;
  status: string;
  createdAt: number;
}) {
  return {
    id: doc._id,
    file_name: doc.fileName,
    mime_type: doc.mimeType ?? null,
    size_bytes: doc.sizeBytes ?? null,
    storage_key: doc.storageKey,
    storage_id: doc.storageId ?? null,
    doc_type: doc.docType,
    status: doc.status,
    created_at: new Date(doc.createdAt).toISOString(),
  };
}

export const listForUser = authedQuery({
  args: {},
  returns: v.array(documentRow),
  handler: async (ctx) => {
    const docs = await paginateAll(
      ctx.db
        .query("documents")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", ctx.user._id).eq("status", "active")
        )
    );
    return docs.map(mapDoc).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
});

export const insert = authedMutation({
  args: {
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageKey: v.string(),
    docType: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const docType = (DOCUMENT_TYPES as readonly string[]).includes(args.docType)
      ? args.docType
      : "OTHER";
    const now = Date.now();
    return await ctx.db.insert("documents", {
      userId: ctx.user._id,
      fileName: args.fileName,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      storageKey: args.storageKey,
      storageId: args.storageId,
      docType,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getById = authedQuery({
  args: { docId: v.string() },
  returns: v.union(documentRow, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("documents", args.docId as Id<"documents">);
    if (!doc || doc.userId !== ctx.user._id || doc.status !== "active") return null;
    return mapDoc(doc);
  },
});

export const softDelete = authedMutation({
  args: { docId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("documents", args.docId as Id<"documents">);
    if (!doc || doc.userId !== ctx.user._id || doc.status !== "active") return false;
    await ctx.db.patch("documents", doc._id, {
      status: "deleted",
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const generateUploadUrl = authedMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getDownloadUrl = authedQuery({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
