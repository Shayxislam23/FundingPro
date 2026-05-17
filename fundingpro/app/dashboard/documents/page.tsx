"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { EmptyState } from "@/components/design/EmptyState";
import { FolderOpen, Upload, File, Lock, Eye, Trash2, Plus } from "lucide-react";

const docTypes = ["Все", "Учредительные", "Финансовые", "CV / Резюме", "Письма поддержки", "Отчёты"];

const mockDocs = [
  { id: "1", name: "Устав организации.pdf", type: "Учредительные", size: "2.4 MB", uploadedAt: "10.05.2025" },
  { id: "2", name: "Свидетельство о регистрации.pdf", type: "Учредительные", size: "1.1 MB", uploadedAt: "10.05.2025" },
  { id: "3", name: "Финансовый отчёт 2024.xlsx", type: "Финансовые", size: "890 KB", uploadedAt: "12.05.2025" },
  { id: "4", name: "CV директора.pdf", type: "CV / Резюме", size: "450 KB", uploadedAt: "13.05.2025" },
  { id: "5", name: "Письмо поддержки ПРООН.pdf", type: "Письма поддержки", size: "320 KB", uploadedAt: "14.05.2025" },
];

export default function DocumentsPage() {
  const [activeType, setActiveType] = useState("Все");

  const filtered = mockDocs.filter((d) => activeType === "Все" || d.type === activeType);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Хранилище</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Документы</h1>
          <p className="text-sm text-gray-500 mt-1">Безопасное хранение документов. Прямые публичные ссылки отключены.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "#008A2E" }}>
          <Upload className="w-4 h-4" />
          Загрузить
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-3 p-4 rounded-xl mb-5" style={{ background: "#D9F7DD" }}>
        <Lock className="w-4 h-4 text-funding-green flex-shrink-0" />
        <p className="text-xs text-funding-text-muted-light">
          Документы защищены. Публичные URL отсутствуют. Каждый доступ записывается в журнал аудита.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {docTypes.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={activeType === t ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
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
              {filtered.map((doc, i) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }}
                  className="hover:bg-funding-light-bg transition-colors"
                >
                  <td className="px-4 py-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-funding-light-green flex items-center justify-center flex-shrink-0">
                      <File className="w-4 h-4 text-funding-green" />
                    </div>
                    <span className="text-sm font-medium text-funding-black">{doc.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{doc.size}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{doc.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-funding-green transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
