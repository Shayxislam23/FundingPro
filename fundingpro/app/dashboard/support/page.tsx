"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { MessageSquare, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
};

function statusLabel(status: string): string {
  if (status === "resolved" || status === "closed") return "Решено";
  if (status === "in_progress") return "В работе";
  return "Открыто";
}

function statusStyle(status: string): { background: string; color: string } {
  if (status === "resolved" || status === "closed") {
    return { background: "#D9F7DD", color: "#008A2E" };
  }
  if (status === "in_progress") {
    return { background: "#DBEAFE", color: "#2563EB" };
  }
  return { background: "#FEF3C7", color: "#D97706" };
}

export default function SupportDashboard() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [listError, setListError] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const fetchTickets = useCallback(async () => {
    setListError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/support-tickets", { headers });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error?.message ?? "Не удалось загрузить обращения");
        setTickets([]);
        return;
      }
      setTickets(data.data?.tickets ?? []);
    } catch {
      setListError("Не удалось загрузить обращения");
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoadingTickets(true);
      try {
        const headers = await getAuthHeaders();
        await fetch("/api/v1/me", { headers });
      } catch {
        /* non-blocking */
      }
      await fetchTickets();
    }
    void init();
  }, [fetchTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/support-tickets", {
        method: "POST",
        headers,
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error?.message ?? "Не удалось отправить обращение");
        return;
      }
      setSubmitted(true);
      setSubject("");
      setMessage("");
      await fetchTickets();
      setTimeout(() => setSubmitted(false), 6000);
    } catch {
      setSubmitError("Не удалось отправить обращение");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Поддержка</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Служба поддержки</h1>
        <p className="text-sm text-gray-500 mt-1">
          Обращения попадают в службу поддержки FundingPro. Ответ придёт на ваш email.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-funding-black mb-4">Создать обращение</h2>
          {submitted && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#D9F7DD" }}>
              <CheckCircle2 className="w-4 h-4 text-funding-green" />
              <p className="text-sm font-medium text-funding-green">
                Обращение отправлено — оно появится справа в списке
              </p>
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-50 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
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
                <option value="Вопрос по оплате">Вопрос по оплате</option>
                <option value="Вопрос по гранту">Вопрос по гранту</option>
                <option value="Проблема с AI-функцией">Проблема с AI-функцией</option>
                <option value="Проблема с аккаунтом">Проблема с аккаунтом</option>
                <option value="Стать консультантом">Стать консультантом</option>
                <option value="Другое">Другое</option>
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
              disabled={!subject || !message.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
              style={{ background: "#008A2E" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Отправить
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-bold text-funding-black mb-4">Мои обращения</h2>
          {listError && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {listError}
            </div>
          )}
          {loadingTickets ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-funding-green" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">Обращений пока нет</div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-funding-black">{t.subject}</h3>
                    <span
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={statusStyle(t.status)}
                    >
                      {t.status === "resolved" || t.status === "closed" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
