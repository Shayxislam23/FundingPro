import { getSettingValue } from "@/lib/db/settings";
import { getPaymentIntegrationStatus, isPaymentsEnabled } from "./config";

const ACTIVE_INTEGRATION_VALUES = new Set(["active", "enabled"]);

function isPendingStatus(status: string | null | undefined): boolean {
  if (!status) return true;
  return !ACTIVE_INTEGRATION_VALUES.has(status.toLowerCase());
}

export async function isPaymentIntegrationPending(): Promise<boolean> {
  try {
    const setting = await getSettingValue("paymentIntegrationStatus");
    if (setting !== null) {
      return isPendingStatus(setting);
    }
  } catch (err) {
    console.warn("Failed to read paymentIntegrationStatus from Convex settings:", err);
  }

  if (!isPaymentsEnabled()) return true;
  return getPaymentIntegrationStatus() !== "active";
}
