"use client";

import { useState, useEffect, useRef } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { EmptyState } from "@/components/design/EmptyState";
import { FolderOpen, Upload, File, Lock, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Doc = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      const headers = await getAuthHeaders();
      const form = new FormData();
      form.append("file", file);
      form.append("docType", "other");
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Хранилище</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Документы</h1>
          <p className="text-sm text-gray-500 mt-1">Безопасное хранение документов. Прямые публичные ссылки отключены.</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: "#008A2E" }}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Загрузить
        </button>
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
          description="Загрузите документы организации для использования в заявках"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                      {DOC_TYPE_MAP[doc.mime_type] ?? "Файл"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatSize(doc.size_bytes)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
