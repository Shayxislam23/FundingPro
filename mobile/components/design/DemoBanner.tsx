import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { cn } from "../cn";

type DemoBannerProps = {
  variant?: "preview" | "offline";
  className?: string;
};

const COPY: Record<NonNullable<DemoBannerProps["variant"]>, string> = {
  preview: "Примеры из каталога",
  offline: "Офлайн-режим — показаны сохранённые данные",
};

export function DemoBanner({ variant = "preview", className }: DemoBannerProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-2 rounded-2xl border border-funding-green/20 bg-funding-light-green/60 px-4 py-3",
        className
      )}
    >
      <Ionicons name="information-circle" size={18} color="#008A2E" />
      <Text className="flex-1 text-sm text-funding-text-muted-light">{COPY[variant]}</Text>
    </View>
  );
}
