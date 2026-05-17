"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { ArrowLeft, Phone, Mail, ArrowRight, RotateCcw } from "lucide-react";

type Mode = "choose" | "login" | "register";
type Channel = "phone" | "email";
type Step = "input" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [channel, setChannel] = useState<Channel>("phone");
  const [step, setStep] = useState<Step>("input");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP input refs
  const otpRefs = Array.from({ length: 6 }, () => null) as (HTMLInputElement | null)[];

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  }

  function handleSendOtp() {
    setError("");
    if (!value.trim()) {
      setError(channel === "phone" ? "Введите номер телефона" : "Введите email");
      return;
    }
    if (channel === "phone" && !/^\+?[\d\s\-()]{7,}$/.test(value)) {
      setError("Неверный формат номера телефона");
      return;
    }
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Неверный формат email");
      return;
    }
    setLoading(true);
    // TODO: call POST /api/v1/auth/otp/send
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 800);
  }

  function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Введите 6-значный код");
      return;
    }
    setLoading(true);
    // TODO: call POST /api/v1/auth/otp/verify
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 900);
  }

  function reset() {
    setStep("input");
    setValue("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }

  const isRegister = mode === "register";
  const title = isRegister ? "Регистрация" : "Вход";
  const subtitle = isRegister
    ? "Создайте аккаунт, чтобы начать работу с грантами"
    : "Войдите, чтобы продолжить работу";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <FundingProLogo variant="dark" size="md" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "#A7B8AA" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          На главную
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Mode chooser */}
          {mode === "choose" && (
            <div className="text-center">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8 tracking-wide"
                style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
                Вход / Регистрация
              </div>
              <h1 className="text-3xl font-black text-white mb-2">Добро пожаловать</h1>
              <p className="text-sm mb-10" style={{ color: "#A7B8AA" }}>
                Войдите или создайте новый аккаунт
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setMode("login")}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                  style={{ background: "#008A2E", color: "#fff" }}
                >
                  <span>Войти в аккаунт</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMode("register")}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-semibold text-sm border transition-all hover:border-funding-green"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                >
                  <span>Создать аккаунт</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Login / Register form */}
          {mode !== "choose" && (
            <>
              {/* Back */}
              <button
                onClick={() => { setMode("choose"); reset(); }}
                className="inline-flex items-center gap-1.5 text-xs mb-8 transition-colors"
                style={{ color: "#A7B8AA" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Назад
              </button>

              <h1 className="text-3xl font-black text-white mb-1">{title}</h1>
              <p className="text-sm mb-8" style={{ color: "#A7B8AA" }}>{subtitle}</p>

              {step === "input" && (
                <>
                  {/* Channel toggle */}
                  <div
                    className="flex gap-1 p-1 rounded-xl mb-6"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    {(["phone", "email"] as Channel[]).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => { setChannel(ch); setValue(""); setError(""); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
                        style={
                          channel === ch
                            ? { background: "#008A2E", color: "#fff" }
                            : { color: "#A7B8AA" }
                        }
                      >
                        {ch === "phone" ? <Phone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                        {ch === "phone" ? "Телефон" : "Email"}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-2" style={{ color: "#A7B8AA" }}>
                      {channel === "phone" ? "Номер телефона" : "Email адрес"}
                    </label>
                    <input
                      type={channel === "phone" ? "tel" : "email"}
                      placeholder={channel === "phone" ? "+998 90 000 00 00" : "you@example.com"}
                      value={value}
                      onChange={(e) => { setValue(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-xs mb-4" style={{ color: "#f87171" }}>{error}</p>
                  )}

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                    style={{ background: "#008A2E", color: "#fff" }}
                  >
                    {loading ? "Отправляем..." : "Получить код"}
                  </button>

                  {isRegister && (
                    <p className="text-xs mt-4 text-center leading-relaxed" style={{ color: "rgba(167,184,170,0.6)" }}>
                      Регистрируясь, вы соглашаетесь с условиями использования платформы FundingPro.
                    </p>
                  )}

                  <p className="text-xs mt-6 text-center" style={{ color: "#A7B8AA" }}>
                    {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                    <button
                      onClick={() => { setMode(isRegister ? "login" : "register"); reset(); }}
                      className="font-semibold underline"
                      style={{ color: "#12B94F" }}
                    >
                      {isRegister ? "Войти" : "Зарегистрироваться"}
                    </button>
                  </p>
                </>
              )}

              {step === "otp" && (
                <>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
                    style={{ background: "rgba(0,138,46,0.1)", border: "1px solid rgba(0,138,46,0.2)" }}
                  >
                    {channel === "phone" ? (
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "#12B94F" }} />
                    ) : (
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "#12B94F" }} />
                    )}
                    <div>
                      <p className="text-xs font-medium text-white">Код отправлен</p>
                      <p className="text-xs" style={{ color: "#A7B8AA" }}>{value}</p>
                    </div>
                  </div>

                  <label className="block text-xs font-medium mb-3" style={{ color: "#A7B8AA" }}>
                    Введите 6-значный код
                  </label>

                  {/* OTP boxes */}
                  <div className="flex gap-2 mb-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="flex-1 text-center py-4 rounded-xl text-lg font-bold outline-none transition-all"
                        style={{
                          background: digit ? "rgba(0,138,46,0.15)" : "rgba(255,255,255,0.06)",
                          border: digit ? "1px solid rgba(0,138,46,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          minWidth: 0,
                        }}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="text-xs mb-4" style={{ color: "#f87171" }}>{error}</p>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join("").length < 6}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mb-4"
                    style={{ background: "#008A2E", color: "#fff" }}
                  >
                    {loading ? "Проверяем..." : isRegister ? "Создать аккаунт" : "Войти"}
                  </button>

                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs transition-colors"
                    style={{ color: "#A7B8AA" }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Изменить {channel === "phone" ? "номер" : "email"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: "rgba(167,184,170,0.3)" }}>
          Beta Version Solutions ООО, DGU No. 61712
        </p>
      </div>
    </div>
  );
}
