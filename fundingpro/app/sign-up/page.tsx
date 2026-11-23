"use client";

import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-sm text-neutral-600">
          Загрузка…
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
