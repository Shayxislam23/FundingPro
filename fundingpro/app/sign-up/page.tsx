"use client";

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";

function SignUpContent() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <FundingProLogo variant="light" className="h-8 w-auto" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Регистрация в FundingPro</h1>
            <p className="mt-2 text-slate-600 text-sm">
              Создайте аккаунт, чтобы искать гранты и готовить заявки с AI
            </p>
          </div>
          <SignUp
            routing="hash"
            signInUrl="/auth"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </main>

      <LegalFooter className="px-6 pb-6" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
