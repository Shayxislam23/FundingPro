"use client";

import { useState } from "react";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { MessageSquare, Mail, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ZoomradShell variant="light" title="Поддержка" showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "#D9F7DD" }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: "#008A2E" }} />
          </div>
          <h2 className="text-xl font-black text-funding-black mb-2">Обращение отправлено</h2>
          <p className="text-sm max-w-xs" style={{ color: "#4A5A4D" }}>
            Команда FundingPro ответит в течение 1 рабочего дня
          </p>
        </div>
      </ZoomradShell>
    );
  }

  return (
    <ZoomradShell variant="light" title="Поддержка" showBack>
      <div className="px-5 pt-5 pb-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#008A2E" }}>
            Помощь
          </p>
          <h1 className="text-2xl font-black text-funding-black mb-1">Свяжитесь с нами</h1>
          <p className="text-sm" style={{ color: "#4A5A4D" }}>Отвечаем в течение 1 рабочего дня</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: MessageSquare, label: "Telegram", href: "#" },
            { icon: Mail, label: "Email", href: "mailto:support@fundingpro.uz" },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-3 p-4 rounded-2xl border"
              style={{ background: "#F7FAF7", borderColor: "#e5e7eb" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#D9F7DD" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#008A2E" }} />
              </div>
              <span className="text-sm font-semibold text-funding-black">{label}</span>
            </a>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#4A5A4D" }}>
              Тема
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: "#e5e7eb", background: "#fff", color: subject ? "#050505" : "#9ca3af" }}
              required
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
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#4A5A4D" }}>
              Сообщение
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Опишите вашу проблему или вопрос..."
              rows={5}
              required
              className="w-full px-4 py-3 rounded-xl text-sm border resize-none outline-none"
              style={{ borderColor: "#e5e7eb", background: "#fff" }}
            />
          </div>

          <button
            type="submit"
            disabled={!subject || !message.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
            style={{ background: "#008A2E" }}
          >
            Отправить обращение
          </button>
        </form>

        <p className="text-xs text-center mt-5" style={{ color: "#9ca3af" }}>
          Beta Version Solutions ООО, DGU No. 61712
        </p>
      </div>
    </ZoomradShell>
  );
}
