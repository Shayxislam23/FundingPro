import { getPaymeConfig } from "../../config";

export function buildPaymeCheckoutUrl(
  paymentId: string,
  amountTiyin: number,
  returnUrl?: string
): string | null {
  const { merchantId, checkoutBaseUrl } = getPaymeConfig();
  if (!merchantId) return null;

  const payload = {
    m: merchantId,
    ac: { order_id: paymentId },
    a: amountTiyin,
    c: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/subscription/return?paymentId=${paymentId}`,
    l: "ru",
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${checkoutBaseUrl.replace(/\/$/, "")}/${encoded}`;
}
