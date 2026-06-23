"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type ConsentState = {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptAi: boolean;
};

type ConsentCheckboxesProps = {
  value: ConsentState;
  onChange: (value: ConsentState) => void;
  className?: string;
  dark?: boolean;
};

export function ConsentCheckboxes({ value, onChange, className, dark }: ConsentCheckboxesProps) {
  const labelClass = dark ? "text-sm text-gray-300" : "text-xs text-gray-600";
  const linkClass = dark ? "text-green-300 underline hover:text-white" : "text-funding-green underline";

  function toggle(key: keyof ConsentState) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label className={cn("flex items-start gap-2.5 cursor-pointer", labelClass)}>
        <input
          type="checkbox"
          checked={value.acceptTerms}
          onChange={() => toggle("acceptTerms")}
          className="mt-0.5 rounded border-gray-400 text-funding-green focus:ring-funding-green"
        />
        <span>
          Я принимаю{" "}
          <Link href="/legal/offer" target="_blank" className={linkClass}>
            публичную оферту
          </Link>
        </span>
      </label>
      <label className={cn("flex items-start gap-2.5 cursor-pointer", labelClass)}>
        <input
          type="checkbox"
          checked={value.acceptPrivacy}
          onChange={() => toggle("acceptPrivacy")}
          className="mt-0.5 rounded border-gray-400 text-funding-green focus:ring-funding-green"
        />
        <span>
          Я согласен с{" "}
          <Link href="/legal/privacy" target="_blank" className={linkClass}>
            политикой конфиденциальности
          </Link>
        </span>
      </label>
      <label className={cn("flex items-start gap-2.5 cursor-pointer", labelClass)}>
        <input
          type="checkbox"
          checked={value.acceptAi}
          onChange={() => toggle("acceptAi")}
          className="mt-0.5 rounded border-gray-400 text-funding-green focus:ring-funding-green"
        />
        <span>
          Согласие на{" "}
          <Link href="/legal/ai" target="_blank" className={linkClass}>
            обработку данных AI
          </Link>{" "}
          (рекомендуется)
        </span>
      </label>
    </div>
  );
}

export function isRequiredConsentGiven(value: ConsentState): boolean {
  return value.acceptTerms && value.acceptPrivacy;
}

export async function submitLegalConsents(
  accessToken: string,
  value: ConsentState,
  locale: "ru" | "uz" = "ru"
): Promise<void> {
  await fetch("/api/v1/legal/consent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      acceptTerms: value.acceptTerms,
      acceptPrivacy: value.acceptPrivacy,
      acceptAi: value.acceptAi,
      locale,
    }),
  });
}
