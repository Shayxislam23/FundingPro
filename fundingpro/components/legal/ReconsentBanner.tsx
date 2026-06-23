"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/client-auth";
import {
  ConsentCheckboxes,
  isRequiredConsentGiven,
  type ConsentState,
} from "@/components/legal/ConsentCheckboxes";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export function ReconsentBanner() {
  const [needsReconsent, setNeedsReconsent] = useState(false);
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    acceptTerms: false,
    acceptPrivacy: false,
    acceptAi: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/legal/consent/status", { headers });
        if (!res.ok) return;
        const json = await res.json();
        setNeedsReconsent(Boolean(json.data?.needsReconsent));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function handleAccept() {
    if (!isRequiredConsentGiven(consent)) {
      setError("Примите оферту и политику конфиденциальности");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/legal/consent", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptTerms: consent.acceptTerms,
          acceptPrivacy: consent.acceptPrivacy,
          acceptAi: consent.acceptAi,
          locale: "ru",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Не удалось сохранить");
      }
      setNeedsReconsent(false);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (!needsReconsent) return null;

  return (
    <>
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm flex-1">
          <p className="font-semibold text-amber-900 mb-1">Обновлены юридические документы</p>
          <p className="text-amber-800 mb-2">
            Примите актуальную{" "}
            <Link href="/legal/offer" className="underline font-medium" target="_blank">
              оферту
            </Link>{" "}
            и{" "}
            <Link href="/legal/privacy" className="underline font-medium" target="_blank">
              политику конфиденциальности
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold text-amber-900 underline"
          >
            Принять сейчас
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-funding-black">Обновление документов</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ConsentCheckboxes value={consent} onChange={setConsent} />
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={handleAccept}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#008A2E" }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Подтвердить
            </button>
          </div>
        </div>
      )}
    </>
  );
}
