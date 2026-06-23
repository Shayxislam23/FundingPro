"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase redirects here with #access_token=... in the URL hash.
  // The JS client picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Пароль должен быть не менее 6 символов"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
      <nav className="flex items-center px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <FundingProLogo variant="dark" size="md" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {done ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(0,138,46,0.15)" }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: "#12B94F" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Пароль обновлён</h1>
              <p className="text-sm" style={{ color: "#A7B8AA" }}>
                Переходим в личный кабинет…
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <AlertCircle className="w-7 h-7" style={{ color: "#f87171" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Ссылка недействительна</h1>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#A7B8AA" }}>
                Эта ссылка истекла или уже была использована. Запросите новую ссылку.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#008A2E", color: "#fff" }}
              >
                Запросить новую ссылку
              </Link>
            </div>
          ) : (
            <>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8 tracking-wide"
                style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
                Новый пароль
              </div>

              <h1 className="text-3xl font-black text-white mb-1">Сброс пароля</h1>
              <p className="text-sm mb-8" style={{ color: "#A7B8AA" }}>
                Придумайте новый пароль для вашего аккаунта
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#A7B8AA" }}>
                    Новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#A7B8AA" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Минимум 6 символов"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "#A7B8AA" }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#A7B8AA" }}>
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#A7B8AA" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Повторите пароль"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: confirm && confirm !== password
                          ? "1px solid rgba(239,68,68,0.5)"
                          : "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  style={{ background: "#008A2E", color: "#fff" }}
                >
                  {loading ? "Сохраняем..." : "Сохранить пароль"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="text-center pb-8">
        <LegalFooter style={{ color: "rgba(167,184,170,0.3)" }} />
      </div>
    </div>
  );
}
