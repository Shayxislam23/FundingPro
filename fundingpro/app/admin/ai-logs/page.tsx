"use client";

import { SectionLabel } from "@/components/design/SectionLabel";
import { Bot, Shield, Eye } from "lucide-react";

const mockLogs = [
  { id: "ai_001", user: "ЭкоНКО", type: "proposal/generate", model: "claude-3.5-sonnet", tokens: 2840, redacted: true, date: "17.05.2025 14:32" },
  { id: "ai_002", user: "Центр образования", type: "eligibility/check", model: "gpt-4o", tokens: 1200, redacted: false, date: "17.05.2025 13:15" },
  { id: "ai_003", user: "ГражданФорум", type: "match-grants", model: "claude-3.5-sonnet", tokens: 980, redacted: false, date: "16.05.2025 11:40" },
  { id: "ai_004", user: "АгроКонсалт", type: "budget-narrative/generate", model: "gpt-4o", tokens: 3100, redacted: true, date: "16.05.2025 09:20" },
];

export default function AILogsPage() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>AI-система</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">AI-запросы</h1>
        <p className="text-sm text-gray-500 mt-1">Журнал AI-запросов и статусы редакции персональных данных</p>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background: "#D9F7DD" }}>
        <Shield className="w-4 h-4 text-funding-green flex-shrink-0 mt-0.5" />
        <p className="text-xs text-funding-text-muted-light leading-relaxed">
          Политика AI: персональные данные (ФИО, ПИНФЛ, телефон, e-mail, паспортные данные) редактируются
          перед отправкой внешним AI-провайдерам. Все данные хранятся в Узбекистане.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["ID", "Пользователь", "Тип запроса", "Модель", "Токены", "Редакция", "Дата"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < mockLogs.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-funding-black">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono" style={{ background: "#F7FAF7", color: "#4A5A4D" }}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.tokens.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {log.redacted ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit" style={{ background: "#D9F7DD", color: "#008A2E" }}>
                        <Shield className="w-3 h-3" />
                        Редактировано
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold w-fit" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                        Нет ПД
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
