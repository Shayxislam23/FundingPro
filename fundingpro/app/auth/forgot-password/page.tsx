"use client";

import { useState } from "react";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Введите email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Неверный формат email"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
      <nav className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <FundingProLogo variant="dark" size="md" />
        <Link href="/auth" className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#A7B8AA" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {sent ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(0,138,46,0.15)" }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: "#12B94F" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Письмо отправлено</h1>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#A7B8AA" }}>
                Мы отправили ссылку для сброса пароля на{" "}
                <span className="text-white font-medium">{email}</span>.
                Проверьте папку «Входящие» или «Спам».
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8 tracking-wide"
                style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
                Восстановление пароля
              </div>

              <h1 className="text-3xl font-black text-white mb-1">Забыли пароль?</h1>
              <p className="text-sm mb-8" style={{ color: "#A7B8AA" }}>
                Введите email — мы отправим ссылку для сброса пароля
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#A7B8AA" }}>
                    Email адрес
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#A7B8AA" }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  style={{ background: "#008A2E", color: "#fff" }}
                >
                  {loading ? "Отправляем..." : "Отправить ссылку"}
                </button>

                <p className="text-xs text-center" style={{ color: "#A7B8AA" }}>
                  Вспомнили пароль?{" "}
                  <Link href="/auth" className="font-semibold underline" style={{ color: "#12B94F" }}>
                    Войти
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: "rgba(167,184,170,0.3)" }}>
          Beta Version Solutions ООО, DGU No. 61712
        </p>
      </div>
    </div>
  );
}
