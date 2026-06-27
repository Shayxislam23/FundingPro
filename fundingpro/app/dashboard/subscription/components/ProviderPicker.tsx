"use client";

import { CreditCard, Loader2, Smartphone } from "lucide-react";
import type { PaymentProvider } from "../types";

type ProviderPickerProps = {
  providers: PaymentProvider[];
  paying: boolean;
  highlighted?: boolean;
  onPay: (provider: "uzum" | "payme" | "click", method?: "checkout") => void;
};

export function ProviderPicker({ providers, paying, highlighted, onPay }: ProviderPickerProps) {
  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onPay(provider.id)}
          disabled={paying}
          className="w-full py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={
            highlighted
              ? { background: provider.id === "uzum" ? "#008A2E" : "rgba(0,138,46,0.85)", color: "#fff" }
              : { background: "#F0FDF4", color: "#008A2E", border: "1px solid #BBF7D0" }
          }
        >
          {paying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              {provider.id === "uzum" ? (
                <CreditCard className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              {provider.label}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
