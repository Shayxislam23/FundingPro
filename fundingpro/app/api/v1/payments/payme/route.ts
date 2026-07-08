export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PaymeAuthError, validatePaymeBasicAuth } from "@/lib/payments/providers/payme/auth";
import { handlePaymeRpc } from "@/lib/payments/providers/payme/merchant";
import { paymeError } from "@/lib/payments/providers/payme/errors";
import { isPaymeConfigured, isPaymentsEnabled } from "@/lib/payments/config";
import type { PaymeJsonRpcRequest, PaymeJsonRpcResponse } from "@/lib/payments/types";

function jsonRpcEnvelope(
  id: number | string | null,
  body: { result?: Record<string, unknown>; error?: PaymeJsonRpcResponse["error"] }
): PaymeJsonRpcResponse {
  return {
    id,
    ...body,
  };
}

function paymeJson(
  id: number | string | null,
  body: { result?: Record<string, unknown>; error?: PaymeJsonRpcResponse["error"] }
) {
  return NextResponse.json(jsonRpcEnvelope(id, body), { status: 200 });
}

export async function POST(req: NextRequest) {
  if (!isPaymentsEnabled() || !isPaymeConfigured()) {
    return paymeJson(null, { error: paymeError("INTERNAL_ERROR") });
  }

  try {
    validatePaymeBasicAuth(req.headers.get("authorization"));
  } catch (e) {
    const err =
      e instanceof PaymeAuthError
        ? paymeError("INSUFFICIENT_PRIVILEGE")
        : paymeError("INTERNAL_ERROR");
    return paymeJson(null, { error: err });
  }

  let payload: PaymeJsonRpcRequest;
  try {
    payload = (await req.json()) as PaymeJsonRpcRequest;
  } catch {
    return paymeJson(null, { error: paymeError("INVALID_JSON") });
  }

  const rpcId = payload.id ?? null;
  if (!payload || typeof payload.method !== "string") {
    return paymeJson(rpcId, { error: paymeError("INVALID_PARAMS") });
  }

  const response = await handlePaymeRpc({
    method: payload.method,
    params: payload.params ?? {},
    id: rpcId ?? 0,
  }).catch((err) => {
    console.error("Payme Merchant API error:", err);
    return { id: rpcId, error: paymeError("INTERNAL_ERROR") } as const;
  });

  if ("error" in response) {
    return paymeJson(response.id, { error: response.error });
  }

  return paymeJson(response.id, { result: response.result });
}
