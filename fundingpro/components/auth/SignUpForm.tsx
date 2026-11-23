"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { isClerkPublishableConfigured } from "@/lib/auth/clerk-config";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";
import { authSwitchUrl, safePostAuthPath } from "@/lib/auth/paths";
import { AuthCardLayout } from "./AuthCardLayout";

const CLERK_READY = isClerkPublishableConfigured();

function SignUpFormReady() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, fetchStatus } = useSignUp();

  const redirectTo =
    safePostAuthPath(searchParams.get("next") ?? searchParams.get("redirect")) ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finalizeIfComplete() {
    if (signUp.status !== "complete") return false;
    const { error: finalizeError } = await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        router.replace(decorateUrl(redirectTo));
      },
    });
    if (finalizeError) {
      setError(clerkErrorMessage(finalizeError));
      return true;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (awaitingCode) {
        const { error: verifyError } = await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        });
        if (verifyError) {
          setError(clerkErrorMessage(verifyError));
          return;
        }
        if (!(await finalizeIfComplete())) {
          setError("Код принят, но регистрация ещё не завершена. Попробуйте войти.");
        }
        return;
      }

      const { error: passwordError } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (passwordError) {
        setError(clerkErrorMessage(passwordError));
        return;
      }

      if (await finalizeIfComplete()) {
        return;
      }

      if (signUp.status === "missing_requirements") {
        const { error: verifyError } = await signUp.verifications.sendEmailCode();
        if (verifyError) {
          setError(clerkErrorMessage(verifyError));
          return;
        }
        setAwaitingCode(true);
        return;
      }

      setError("Регистрация не завершена. Попробуйте другой email.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await signUp.verifications.sendEmailCode();
      if (verifyError) {
        setError(clerkErrorMessage(verifyError));
        return;
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isBusy = loading || fetchStatus === "fetching";

  return (
    <AuthCardLayout
      title="Регистрация в FundingPro."
      footer={
        <>
          <span className="text-neutral-600">Уже есть аккаунт? </span>
          <Link
            href={authSwitchUrl("sign-in", redirectTo)}
            className="font-medium text-funding-green hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {awaitingCode ? (
          <>
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm text-neutral-600">
              Код отправлен на {email.trim() || "ваш email"}. Введите его ниже.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Код из письма"
              className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 outline-none ring-funding-green/30 focus:ring-2"
            />
          </>
        ) : (
          <>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 outline-none ring-funding-green/30 focus:ring-2"
            />

            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 8 символов)"
              className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 outline-none ring-funding-green/30 focus:ring-2"
            />
          </>
        )}

        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={
            isBusy ||
            (awaitingCode ? code.trim().length < 4 : !email.trim() || password.length < 8)
          }
          className="w-full rounded-full bg-funding-green py-3 text-sm font-semibold text-white transition-colors hover:bg-funding-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Подождите…" : awaitingCode ? "Подтвердить" : "Зарегистрироваться"}
        </button>

        {awaitingCode ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void resendCode()}
            className="w-full text-center text-sm font-medium text-funding-green hover:underline disabled:opacity-60"
          >
            Отправить код ещё раз
          </button>
        ) : null}
      </form>
    </AuthCardLayout>
  );
}

function SignUpFormSetupRequired() {
  return (
    <AuthCardLayout
      title="Регистрация в FundingPro."
      footer={
        <>
          <span className="text-neutral-600">Уже есть аккаунт? </span>
          <Link href={authSwitchUrl("sign-in")} className="font-medium text-funding-green hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
        Clerk не настроен: вставьте реальные ключи в fundingpro/.env.local, затем npm run clerk:seed-demo
      </p>
    </AuthCardLayout>
  );
}

export function SignUpForm() {
  return CLERK_READY ? <SignUpFormReady /> : <SignUpFormSetupRequired />;
}
