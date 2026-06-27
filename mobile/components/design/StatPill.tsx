import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

type StatPillProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  className?: string;
};

export function StatPill({ icon, value, label, className }: StatPillProps) {
  return (
    <ClaySurface variant="raised" radius="card" className={cn("flex-1 min-w-[45%] p-4", className)}>
      <View className="flex-row items-center gap-2 mb-1.5">
        <ClaySurface variant="inset" radius="pill" className="w-8 h-8 items-center justify-center">
          <Ionicons name={icon} size={16} color="#008A2E" />
        </ClaySurface>
        <Text className="text-title font-black text-funding-black">{value}</Text>
      </View>
      <Text className="text-caption text-funding-text-muted-light">{label}</Text>
    </ClaySurface>
  );
}
