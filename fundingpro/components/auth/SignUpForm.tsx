"use client";

import { useClerk } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { AuthCardLayout } from "./AuthCardLayout";

export function SignUpForm() {
  const router = useRouter();
  const { isLoaded, signUp } = useSignUp();
  const { setActive } = useClerk();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError(null);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      if (signUp.status === "complete" && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        router.replace("/dashboard");
        return;
      }

      if (signUp.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
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
          disabled={loading || !email.trim() || password.length < 8}
          className="w-full rounded-full bg-funding-green py-3 text-sm font-semibold text-white transition-colors hover:bg-funding-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Создание…" : "Зарегистрироваться"}
        </button>
      </form>
    </AuthCardLayout>
  );
}
