import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "../cn";

type StatPillProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  className?: string;
};

export function StatPill({ icon, value, label, className }: StatPillProps) {
  return (
    <View
      className={cn(
        "flex-1 min-w-[45%] rounded-2xl bg-white border border-gray-100 p-4 shadow-card",
        className
      )}
    >
      <View className="flex-row items-center gap-2 mb-1.5">
        <View className="w-8 h-8 rounded-lg bg-funding-light-green items-center justify-center">
          <Ionicons name={icon} size={16} color="#008A2E" />
        </View>
        <Text className="text-title font-black text-funding-black">{value}</Text>
      </View>
      <Text className="text-caption text-gray-500">{label}</Text>
    </View>
  );
}
