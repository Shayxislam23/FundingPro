"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/lib/client-auth";
import type { PaymentConfig } from "../types";

export function useSubscriptionCheckout(paymentConfig: PaymentConfig | null) {
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [acceptPaymentLegal, setAcceptPaymentLegal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/subscription-requests", { headers });
        if (!res.ok) return;
        const json = await res.json();
        const ids: string[] = json.data?.pendingPlanIds ?? [];
        if (ids.length) setRequested(new Set(ids));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function handleRequest(planId: string, planName: string) {
    if (requested.has(planId)) return;
    setRequesting(planId);
    setRequestError(null);
    setRequestSuccess(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/subscription-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId, planName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRequestError(json.error?.message ?? "Не удалось отправить запрос");
        return;
      }
      setRequested((prev) => new Set(prev).add(planId));
      setRequestSuccess(planName);
      setTimeout(() => setRequestSuccess(null), 8000);
    } catch {
      setRequestError("Не удалось отправить запрос");
    } finally {
      setRequesting(null);
    }
  }

  async function handlePay(planId: string, provider: "uzum" | "payme" | "click", method?: "checkout") {
    if (!acceptPaymentLegal) {
      setPayError("Примите оферту и политику возвратов перед оплатой");
      return;
    }
    setPayError(null);
    setPaying(`${planId}:${provider}:${method ?? "default"}`);
    try {
      const headers = await getAuthHeaders();
      const intentRes = await fetch("/api/v1/payments/intent", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId, acceptedPaymentTerms: true, provider }),
      });
      const intentJson = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentJson.error?.message ?? "Intent failed");

      const data = intentJson.data ?? {};
      const { paymentId, uzumAppUrl, paymeCheckoutUrl, clickPayUrl } = data;

      if (provider === "uzum" && method !== "checkout" && uzumAppUrl) {
        window.location.href = uzumAppUrl;
        return;
      }
      if (provider === "payme" && paymeCheckoutUrl) {
        window.location.href = paymeCheckoutUrl;
        return;
      }
      if (provider === "click" && clickPayUrl) {
        window.location.href = clickPayUrl;
        return;
      }

      const checkoutRes = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ paymentId, provider }),
      });
      const checkoutJson = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutJson.error?.message ?? "Checkout failed");

      const redirectUrl = checkoutJson.data?.redirectUrl;
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      setPayError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setPaying(null);
    }
  }

  const enabledProviders =
    paymentConfig?.providers?.filter((p: NonNullable<PaymentConfig["providers"]>[number]) => p.enabled && p.configured) ?? [];

  const paymentsOn = paymentConfig?.paymentsEnabled ?? false;

  return {
    requested,
    requesting,
    requestError,
    requestSuccess,
    paying,
    payError,
    acceptPaymentLegal,
    setAcceptPaymentLegal,
    handleRequest,
    handlePay,
    enabledProviders,
    paymentsOn,
  };
}
