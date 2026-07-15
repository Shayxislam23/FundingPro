import { timingSafeEqual } from "crypto";
import { getPaymeConfig } from "../../config";

export class PaymeAuthError extends Error {
  constructor(public readonly code: number) {
    super("Payme auth failed");
    this.name = "PaymeAuthError";
  }
}

export function validatePaymeBasicAuth(authorizationHeader: string | null): void {
  const { merchantKey, merchantLogin } = getPaymeConfig();
  if (!merchantKey) {
    throw new PaymeAuthError(-32504);
  }
  if (!authorizationHeader?.startsWith("Basic ")) {
    throw new PaymeAuthError(-32504);
  }

  const provided = authorizationHeader.slice(6).trim();
  const expected = Buffer.from(`${merchantLogin}:${merchantKey}`, "utf8").toString("base64");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new PaymeAuthError(-32504);
  }
}
