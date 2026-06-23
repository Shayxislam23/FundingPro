import { NextRequest, NextResponse } from "next/server";
import { UzumAuthError, validateUzumBasicAuth } from "@/lib/payments/uzum-auth";
import { getUzumMerchantConfig } from "@/lib/payments/config";

type Handler<T> = (body: T) => Promise<Record<string, unknown>>;

export async function withUzumMerchant<T extends Record<string, unknown>>(
  req: NextRequest,
  handler: Handler<T>
): Promise<NextResponse> {
  try {
    validateUzumBasicAuth(req.headers.get("authorization"));
    const body = (await req.json()) as T;
    const result = await handler(body);
    const status = result.status === "FAILED" ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (e) {
    const { serviceId } = getUzumMerchantConfig();
    if (e instanceof UzumAuthError) {
      return NextResponse.json(
        {
          serviceId,
          timestamp: String(Date.now()),
          status: "FAILED",
          errorCode: e.errorCode,
        },
        { status: 401 }
      );
    }
    console.error("Uzum merchant handler error:", e);
    return NextResponse.json(
      {
        serviceId,
        timestamp: String(Date.now()),
        status: "FAILED",
        errorCode: "InternalError",
      },
      { status: 500 }
    );
  }
}
