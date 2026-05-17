"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";

const mockTickets = [
  { id: "1", subject: "Вопрос по оплате", status: "resolved", date: "12.05.2025", message: "Как изменить план подписки?" },
  { id: "2", subject: "Проблема с AI-генератором", status: "open", date: "15.05.2025", message: "AI не генерирует раздел логфрейма" },
];

export default function SupportDashboard() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setSubject("");
    setMessage("");
  };

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Поддержка</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Служба поддержки</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* New ticket */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-funding-black mb-4">Создать обращение</h2>
          {submitted && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#D9F7DD" }}>
              <CheckCircle2 className="w-4 h-4 text-funding-green" />
              <p className="text-sm font-medium text-funding-green">Обращение отправлено</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Тема</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-funding-light-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              >
                <option value="" disabled>Выберите тему...</option>
                <option value="payment">Вопрос по оплате</option>
                <option value="grant">Вопрос по гранту</option>
                <option value="ai">Проблема с AI-функцией</option>
                <option value="account">Проблема с аккаунтом</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Сообщение</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Опишите проблему подробно..."
                className="w-full px-4 py-3 bg-funding-light-bg rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-funding-green/20"
              />
            </div>
            <button
              type="submit"
              disabled={!subject || !message.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
              style={{ background: "#008A2E" }}
            >
              Отправить
            </button>
          </form>
        </div>

        {/* Previous tickets */}
        <div>
          <h2 className="font-bold text-funding-black mb-4">Мои обращения</h2>
          <div className="space-y-3">
            {mockTickets.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-funding-black">{t.subject}</h3>
                  <span
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={t.status === "resolved" ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                  >
                    {t.status === "resolved" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {t.status === "resolved" ? "Решено" : "Открыто"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{t.message}</p>
                <p className="text-xs text-gray-300 mt-2">{t.date}</p>
              </div>
            ))}
            {mockTickets.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">Обращений нет</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
