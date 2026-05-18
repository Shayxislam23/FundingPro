"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Supabase puts the token in the URL hash: #access_token=...&type=signup
    // The client library handles it automatically via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else if (event === "USER_UPDATED" && session) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    });

    // Also check current session in case already confirmed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        // Give time for hash parsing
        const timer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (!s2) setStatus("error");
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020703" }}>
      <nav className="flex items-center px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <FundingProLogo variant="dark" size="md" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">

          {status === "loading" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(0,138,46,0.1)" }}
              >
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#12B94F" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Подтверждаем email…</h1>
              <p className="text-sm" style={{ color: "#A7B8AA" }}>Пожалуйста, подождите</p>
            </>
          )}

          {status === "success" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(0,138,46,0.15)" }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: "#12B94F" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Email подтверждён</h1>
              <p className="text-sm" style={{ color: "#A7B8AA" }}>
                Переходим в личный кабинет…
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <AlertCircle className="w-7 h-7" style={{ color: "#f87171" }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Ссылка недействительна</h1>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#A7B8AA" }}>
                Ссылка подтверждения устарела или уже была использована.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#008A2E", color: "#fff" }}
              >
                Вернуться ко входу
              </Link>
            </>
          )}

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
