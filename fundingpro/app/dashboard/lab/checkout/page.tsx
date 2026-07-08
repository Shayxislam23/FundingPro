"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Loader2, Upload } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders, getAuthHeadersForUpload } from "@/lib/client-auth";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/upload-limits";
import type { LabAccess } from "@/lib/db/lab";

type CheckoutData = LabAccess & {
  paymentConfig?: {
    paymentsEnabled: boolean;
    providers?: Array<{
      id: string;
      enabled: boolean;
      configured: boolean;
    }>;
  };
};

export default function LabCheckoutPage() {
  const [access, setAccess] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [payingPayme, setPayingPayme] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchCheckout() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/v1/lab/checkout", { headers });
    const data = await res.json();
    setAccess(data.data ?? null);
  }

  useEffect(() => {
    fetchCheckout()
      .catch(() => setError("Не удалось открыть оплату Lab"))
      .finally(() => setLoading(false));
  }, []);

  async function uploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Файл слишком большой. Максимум ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const uploadHeaders = await getAuthHeadersForUpload();
      const form = new FormData();
      form.append("file", file);
      form.append("docType", "PAYMENT_PROOF");
      const uploadRes = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: uploadHeaders,
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error?.message ?? "Не удалось загрузить proof оплаты");
        return;
      }

      const headers = await getAuthHeaders();
      const proofRes = await fetch("/api/v1/lab/payment-proof", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId: uploadData.data?.documentId }),
      });
      const proofData = await proofRes.json();
      if (!proofRes.ok) {
        setError(proofData.error?.message ?? "Не удалось отправить proof на проверку");
        return;
      }
      setAccess((prev) => ({ ...proofData.data, paymentConfig: prev?.paymentConfig }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function startPaymePayment() {
    setError("");
    setPayingPayme(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/lab/payme-intent", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Payme пока не готов. Используйте manual fallback.");
        return;
      }
      const redirectUrl = data.data?.redirectUrl;
      if (!redirectUrl) {
        setError("Payme redirect URL не получен");
        return;
      }
      window.location.href = redirectUrl;
    } finally {
      setPayingPayme(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  const status = access?.enrollment?.status ?? "pending_payment";
  const paid = access?.hasPaidAccess;
  const nextAction = access?.nextAction;
  const paymeAvailable = Boolean(
    access?.paymentConfig?.paymentsEnabled &&
      access.paymentConfig.providers?.some(
        (provider) => provider.id === "payme" && provider.enabled && provider.configured
      )
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <SectionLabel>Мой путь</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Оплата курса</h1>
        <p className="text-sm text-gray-500 mt-1">
          {access?.cohort.name ?? "Мой путь к заявке"}
        </p>
        {nextAction && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-sm font-semibold text-funding-black">{nextAction.label}</p>
            <p className="text-sm text-gray-500 mt-1">{nextAction.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-funding-light-green flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-funding-green" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Сумма к оплате</p>
            <p className="text-3xl font-black text-funding-black">
              {(access?.cohort.priceUzs ?? 150000).toLocaleString("ru-RU")} UZS
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Для первого потока: 34 участника x 150 000 сум.
            </p>
          </div>
        </div>

        {paymeAvailable && !paid && status !== "manual_review" && status !== "failed" && status !== "refunded" && (
          <button
            type="button"
            onClick={startPaymePayment}
            disabled={payingPayme}
            className="inline-flex w-fit items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#008A2E" }}
          >
            {payingPayme ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Оплатить через Payme
          </button>
        )}

        <div className="rounded-xl bg-funding-light-bg p-4">
          <p className="text-sm font-semibold text-funding-black mb-2">
            {paymeAvailable ? "Manual fallback" : "Manual payment"}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Если онлайн-оплата временно недоступна, оплатите на карту/счёт и загрузите screenshot.
            После проверки админ откроет доступ к Lab.
          </p>
        </div>

        {error && <div className="rounded-xl bg-red-50 text-red-600 text-sm p-4">{error}</div>}

        {paid ? (
          <div className="rounded-xl bg-funding-light-green text-funding-green p-4 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Оплата подтверждена. Доступ к Lab открыт.
          </div>
        ) : status === "manual_review" ? (
          <div className="rounded-xl bg-amber-50 text-amber-700 p-4 text-sm">
            Proof оплаты отправлен на проверку. Обычно подтверждение занимает несколько часов.
          </div>
        ) : status === "failed" || status === "refunded" ? (
          <div className="rounded-xl bg-red-50 text-red-600 p-4 text-sm">
            Этот enrollment требует проверки поддержки перед повторной оплатой.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#008A2E" }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload payment proof
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={uploadProof}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/dashboard/lab" className="text-sm font-semibold text-funding-green">
            Open Lab dashboard
          </Link>
          <Link href="/dashboard/lab/start" className="text-sm font-semibold text-gray-500">
            First lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
