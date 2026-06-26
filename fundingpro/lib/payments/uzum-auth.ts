import { timingSafeEqual } from "crypto";
import { getUzumMerchantConfig } from "./config";

export class UzumAuthError extends Error {
  constructor(public readonly errorCode: string) {
    super(errorCode);
    this.name = "UzumAuthError";
  }
}

export function validateUzumBasicAuth(authorizationHeader: string | null): void {
  const { login, password } = getUzumMerchantConfig();
  if (!login || !password) {
    throw new UzumAuthError("MerchantNotConfigured");
  }
  if (!authorizationHeader?.startsWith("Basic ")) {
    throw new UzumAuthError("TokenIsRequired");
  }

  const provided = authorizationHeader.slice(6).trim();
  const expected = Buffer.from(`${login}:${password}`, "utf8").toString("base64");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new UzumAuthError("InvalidToken");
  }
}
