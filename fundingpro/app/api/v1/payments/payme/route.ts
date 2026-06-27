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
    jsonrpc: "2.0",
    id,
    ...body,
  };
}

export async function POST(req: NextRequest) {
  if (!isPaymentsEnabled() || !isPaymeConfigured()) {
    return NextResponse.json(
      jsonRpcEnvelope(null, { error: paymeError("INTERNAL_ERROR") }),
      { status: 503 }
    );
  }

  try {
    validatePaymeBasicAuth(req.headers.get("authorization"));
  } catch (e) {
    const err =
      e instanceof PaymeAuthError
        ? paymeError("INSUFFICIENT_PRIVILEGE")
        : paymeError("INTERNAL_ERROR");
    return NextResponse.json(jsonRpcEnvelope(null, { error: err }), { status: 401 });
  }

  let payload: PaymeJsonRpcRequest;
  try {
    payload = (await req.json()) as PaymeJsonRpcRequest;
  } catch {
    return NextResponse.json(jsonRpcEnvelope(null, { error: paymeError("INVALID_JSON") }), {
      status: 400,
    });
  }

  const rpcId = payload.id ?? null;
  const response = await handlePaymeRpc({
    method: payload.method,
    params: payload.params ?? {},
    id: rpcId ?? 0,
  });

  if ("error" in response) {
    return NextResponse.json(jsonRpcEnvelope(response.id, { error: response.error }), { status: 200 });
  }

  return NextResponse.json(jsonRpcEnvelope(response.id, { result: response.result }));
}
