import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
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
    <ClaySurface variant="inset" radius="card" className={cn("px-4 py-3", className)}>
      <View className="flex-row items-center gap-2">
        <Ionicons name="information-circle" size={18} color="#008A2E" />
        <Text className="flex-1 text-sm text-funding-text-muted-light">{COPY[variant]}</Text>
      </View>
    </ClaySurface>
  );
}
