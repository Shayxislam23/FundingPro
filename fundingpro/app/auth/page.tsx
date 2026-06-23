"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import {
  ConsentCheckboxes,
  isRequiredConsentGiven,
  submitLegalConsents,
  type ConsentState,
} from "@/components/legal/ConsentCheckboxes";
import { supabase } from "@/lib/supabase";
import { trackEvent, captureUtmParams } from "@/lib/analytics";
import { ArrowLeft, Mail, ArrowRight, KeyRound } from "lucide-react";
import { useEffect } from "react";

type Step = "email" | "code";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState<ConsentState>({
    acceptTerms: false,
    acceptPrivacy: false,
    acceptAi: false,
  });

  const normalizedEmail = email.toLowerCase().trim();

  useEffect(() => {
    captureUtmParams();
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!normalizedEmail) {
      setError("Введите email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Неверный формат email");
      return;
    }
    if (!isRequiredConsentGiven(consent)) {
      setError("Примите оферту и политику конфиденциальности");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        // Без redirect — Supabase отправит 6-значный код (шаблон с {{ .Token }})
      },
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    trackEvent("auth_otp_sent");
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const token = code.replace(/\s/g, "");
    if (token.length < 6) {
      setError("Введите 6-значный код из письма");
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });
    setLoading(false);

    if (err) {
      setError(err.message.includes("expired") ? "Код истёк. Запросите новый." : "Неверный код");
      return;
    }

    if (data.session?.access_token) {
      try {
        await submitLegalConsents(data.session.access_token, consent, "ru");
        await fetch("/api/v1/auth/audit-login", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch {
        /* non-blocking */
      }
    }

    trackEvent("auth_success");
    const destination =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/dashboard";
    router.push(destination);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
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
            {step === "email" ? "Вход по email" : "Подтверждение"}
          </div>

          <h1 className="text-3xl font-black text-white mb-1">
            {step === "email" ? "Добро пожаловать" : "Введите код"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#A7B8AA" }}>
            {step === "email"
              ? "Мы отправим одноразовый код на ваш email"
              : `Код отправлен на ${normalizedEmail}`}
          </p>

          {step === "code" && (
            <p className="text-xs mb-6 leading-relaxed" style={{ color: "rgba(167,184,170,0.75)" }}>
              Проверьте входящие и папку «Спам». Код действует 1 час.
            </p>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none"
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

              <ConsentCheckboxes value={consent} onChange={setConsent} dark className="pt-1" />

              {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !isRequiredConsentGiven(consent)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{ background: "#008A2E", color: "#fff" }}
              >
                {loading ? "Отправляем..." : <>Получить код <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#A7B8AA" }}>
                  Код из письма
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#A7B8AA" }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none tracking-[0.3em]"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                    }}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{ background: "#008A2E", color: "#fff" }}
              >
                {loading ? "Проверяем..." : <>Войти <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="w-full text-xs font-medium py-2"
                style={{ color: "#12B94F" }}
              >
                Изменить email или запросить код снова
              </button>
            </form>
          )}

          <p className="text-xs text-center mt-8 leading-relaxed" style={{ color: "rgba(167,184,170,0.5)" }}>
            FundingPro не гарантирует получение гранта. Платформа помогает найти возможности и подготовить заявку.
          </p>
        </div>
      </div>

      <div className="text-center pb-8">
        <LegalFooter variant="dark" style={{ color: "rgba(167,184,170,0.3)" }} />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#020703" }} />}>
      <AuthForm />
    </Suspense>
  );
}
