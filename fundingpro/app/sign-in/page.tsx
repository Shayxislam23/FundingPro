"use client";

import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-sm text-neutral-600">
          Загрузка…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
