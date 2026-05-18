"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Введите email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Неверный формат email"); return; }
    if (password.length < 6) { setError("Пароль должен быть не менее 6 символов"); return; }

    setLoading(true);

    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      setLoading(false);
      if (err) {
        if (err.message.includes("Invalid login credentials")) {
          setError("Неверный email или пароль");
        } else if (err.message.includes("Email not confirmed")) {
          setError("Подтвердите email перед входом");
        } else {
          setError(err.message);
        }
        return;
      }
      router.push("/dashboard");
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });
      setLoading(false);
      if (err) {
        if (err.message.includes("already registered") || err.message.includes("already been registered")) {
          setError("Этот email уже зарегистрирован. Войдите в аккаунт.");
        } else {
          setError(err.message);
        }
        return;
      }
      setSuccess("Аккаунт создан. Проверьте email для подтверждения.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <FundingProLogo variant="dark" size="md" />
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#A7B8AA" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          На главную
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8 tracking-wide"
            style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
            {mode === "login" ? "Вход" : "Регистрация"}
          </div>

          <h1 className="text-3xl font-black text-white mb-1">
            {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#A7B8AA" }}>
            {mode === "login"
              ? "Войдите, чтобы продолжить работу с грантами"
              : "Зарегистрируйтесь, чтобы начать работу с грантами"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "#A7B8AA" }}>
                  Пароль
                </label>
                {mode === "login" && (
                  <Link href="/auth/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "#12B94F" }}>
                    Забыли пароль?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#A7B8AA" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Введите пароль"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
                  style={{ color: "#A7B8AA" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
            {success && <p className="text-xs" style={{ color: "#12B94F" }}>{success}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: "#008A2E", color: "#fff" }}
            >
              {loading
                ? (mode === "login" ? "Входим..." : "Создаём аккаунт...")
                : (
                  <>
                    {mode === "login" ? "Войти" : "Зарегистрироваться"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
            </button>

            {mode === "register" && (
              <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(167,184,170,0.5)" }}>
                Регистрируясь, вы соглашаетесь с условиями использования платформы FundingPro.
              </p>
            )}
          </form>

          {/* Switch mode */}
          <p className="text-xs text-center mt-6" style={{ color: "#A7B8AA" }}>
            {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-semibold underline"
              style={{ color: "#12B94F" }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
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
