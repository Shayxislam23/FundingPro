"use client";

import { useState, useEffect, useRef } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { EmptyState } from "@/components/design/EmptyState";
import { FolderOpen, Upload, File, Lock, Trash2, Loader2, Download } from "lucide-react";
import { getAuthHeaders, getAuthHeadersForUpload } from "@/lib/client-auth";

type Doc = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  doc_type?: string;
  created_at: string;
};

const DOC_CATEGORY_LABELS: Record<string, string> = {
  REG_CERT: "Свидетельство о регистрации",
  CHARTER: "Устав",
  TAX_CERT: "Налоговый сертификат",
  BANK_DETAILS: "Банковские реквизиты",
  CV: "CV",
  SUPPORT_LETTER: "Письмо поддержки",
  PORTFOLIO: "Портфолио проектов",
  FIN_REPORT: "Финансовый отчёт",
  PROPOSAL_DRAFT: "Черновик заявки",
  BUDGET: "Бюджет",
  OTHER: "Другое",
};

const DOC_TYPE_MAP: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "image/jpeg": "Изображение",
  "image/png": "Изображение",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("OTHER");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/documents", { headers });
      const data = await res.json();
      setDocs(data.data?.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const headers = await getAuthHeadersForUpload();
      const form = new FormData();
      form.append("file", file);
      form.append("docType", docType);
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers,
        body: form,
      });
      if (res.ok) await fetchDocs();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    const headers = await getAuthHeadersForUpload();
    const res = await fetch(`/api/v1/documents/${id}/download`, { headers });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/v1/documents?id=${id}`, { method: "DELETE", headers });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <SectionLabel>Хранилище</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Документы</h1>
          <p className="text-sm text-gray-500 mt-1">Безопасное хранение документов. Прямые публичные ссылки отключены.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-600"
          >
            {Object.entries(DOC_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: "#008A2E" }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Загрузить
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={handleUpload}
        />
      </div>

      {/* Security note */}
      <div className="flex items-center gap-3 p-4 rounded-xl mb-5" style={{ background: "#D9F7DD" }}>
        <Lock className="w-4 h-4 text-funding-green flex-shrink-0" />
        <p className="text-xs text-funding-text-muted-light">
          Документы защищены. Публичные URL отсутствуют. Каждый доступ записывается в журнал аудита.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Нет документов"
          description="Загрузите устав, свидетельство о регистрации или CV для заявок на гранты"
          action={
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#008A2E" }}
            >
              Загрузить документ
            </button>
          }
        />
      ) : (
        <>
        <div className="md:hidden space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-funding-light-green flex items-center justify-center flex-shrink-0">
                  <File className="w-4 h-4 text-funding-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-funding-black truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {DOC_CATEGORY_LABELS[doc.doc_type ?? "OTHER"] ?? "Другое"} · {formatSize(doc.size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => handleDownload(doc.id, doc.file_name)} className="text-xs text-funding-green font-semibold">Скачать</button>
                <button type="button" onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id} className="text-xs text-red-500 font-semibold ml-auto">Удалить</button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Файл", "Тип", "Размер", "Загружен", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: i < docs.length - 1 ? "1px solid #f9fafb" : "none" }}
                  className="hover:bg-funding-light-bg transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-funding-light-green flex items-center justify-center flex-shrink-0">
                        <File className="w-4 h-4 text-funding-green" />
                      </div>
                      <span className="text-sm font-medium text-funding-black truncate max-w-[200px]">{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {DOC_CATEGORY_LABELS[doc.doc_type ?? "OTHER"] ?? DOC_TYPE_MAP[doc.mime_type] ?? "Файл"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatSize(doc.size_bytes)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                        className="p-1.5 rounded-lg hover:bg-funding-light-green text-gray-400 hover:text-funding-green transition-colors"
                        title="Скачать"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
