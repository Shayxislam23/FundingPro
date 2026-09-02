"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { AuthCardLayout } from "./AuthCardLayout";

export function SignUpForm() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const { error: passwordError } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (passwordError) {
        setError(clerkErrorMessage(passwordError));
        return;
      }

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            router.replace(decorateUrl("/dashboard"));
          },
        });
        if (finalizeError) {
          setError(clerkErrorMessage(finalizeError));
        }
        return;
      }

      if (signUp.status === "missing_requirements") {
        const { error: verifyError } = await signUp.verifications.sendEmailCode();
        if (verifyError) {
          setError(clerkErrorMessage(verifyError));
          return;
        }
        router.push("/auth/confirm");
        return;
      }

      setError("Регистрация не завершена. Попробуйте другой email.");
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
          <Link href={SIGN_IN_PATH} className="font-medium text-funding-green hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isBusy || !email.trim() || password.length < 8}
          className="w-full rounded-full bg-funding-green py-3 text-sm font-semibold text-white transition-colors hover:bg-funding-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Создание…" : "Зарегистрироваться"}
        </button>
      </form>
    </AuthCardLayout>
  );
}
