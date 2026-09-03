"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { isClerkPublishableConfigured } from "@/lib/auth/clerk-config";
import { clerkErrorMessage } from "@/lib/auth/clerk-errors";
import { SIGN_UP_PATH } from "@/lib/auth/paths";
import { AuthCardLayout } from "./AuthCardLayout";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? "demo@fundingpro.local";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? "FundingPro!demo1";
const SHOW_DEMO_HINT = process.env.NODE_ENV !== "production";
const CLERK_READY = isClerkPublishableConfigured();

function SignInFormReady() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, fetchStatus } = useSignIn();

  const redirectTo = searchParams.get("next") ?? searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState(SHOW_DEMO_HINT ? DEMO_EMAIL : "");
  const [password, setPassword] = useState(SHOW_DEMO_HINT ? DEMO_PASSWORD : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoHint = useMemo(
    () =>
      SHOW_DEMO_HINT
        ? `Локальный демо: ${DEMO_EMAIL} / ${DEMO_PASSWORD}. Если вход не работает — npm run clerk:seed-demo`
        : null,
    []
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const { error: passwordError } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (passwordError) {
        setError(clerkErrorMessage(passwordError));
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const path = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
            router.replace(decorateUrl(path));
          },
        });
        if (finalizeError) {
          setError(clerkErrorMessage(finalizeError));
        }
        return;
      }

      if (signIn.status === "needs_second_factor") {
        setError("Требуется двухфакторная аутентификация.");
        return;
      }

      setError("Требуется дополнительный шаг входа. Обратитесь в поддержку.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isBusy = loading || fetchStatus === "fetching";

  return (
    <AuthCardLayout
      title="Войдите в FundingPro."
      footer={
        <>
          <span className="text-neutral-600">Нет аккаунта? </span>
          <Link href={SIGN_UP_PATH} className="font-medium text-funding-green hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {demoHint ? (
          <p className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm text-neutral-600">
            {demoHint}
          </p>
        ) : null}

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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 outline-none ring-funding-green/30 focus:ring-2"
        />

        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isBusy || !email.trim() || !password}
          className="w-full rounded-full bg-funding-green py-3 text-sm font-semibold text-white transition-colors hover:bg-funding-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Вход…" : "Войти"}
        </button>
      </form>
    </AuthCardLayout>
  );
}

function SignInFormSetupRequired() {
  return (
    <AuthCardLayout
      title="Войдите в FundingPro."
      footer={
        <>
          <span className="text-neutral-600">Нет аккаунта? </span>
          <Link href={SIGN_UP_PATH} className="font-medium text-funding-green hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Clerk не настроен. В{" "}
          <code className="font-mono text-xs">fundingpro/.env.local</code> замените{" "}
          <code className="font-mono text-xs">pk_test_…</code> /{" "}
          <code className="font-mono text-xs">sk_test_…</code> на ключи из{" "}
          <a
            href="https://dashboard.clerk.com"
            className="font-medium underline"
            target="_blank"
            rel="noreferrer"
          >
            dashboard.clerk.com
          </a>
          , задайте <code className="font-mono text-xs">CLERK_JWT_ISSUER_DOMAIN</code>, затем:{" "}
          <code className="font-mono text-xs">npm run clerk:seed-demo</code> и перезапустите
          Next.js.
        </p>
        <input
          type="email"
          disabled
          defaultValue={DEMO_EMAIL}
          className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-500"
        />
        <input
          type="password"
          disabled
          defaultValue={DEMO_PASSWORD}
          className="w-full rounded-xl border-0 bg-neutral-100 px-4 py-3 text-sm text-neutral-500"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-full bg-funding-green py-3 text-sm font-semibold text-white opacity-60"
        >
          Войти
        </button>
      </div>
    </AuthCardLayout>
  );
}

export function SignInForm() {
  return CLERK_READY ? <SignInFormReady /> : <SignInFormSetupRequired />;
}
