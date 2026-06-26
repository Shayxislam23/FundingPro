import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { cn } from "../cn";

type FundingProLogoProps = {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { mark: "w-7 h-7", icon: 14, text: "text-sm" },
  md: { mark: "w-9 h-9", icon: 18, text: "text-lg" },
  lg: { mark: "w-11 h-11", icon: 22, text: "text-2xl" },
} as const;

export function FundingProLogo({ className, variant = "dark", size = "md" }: FundingProLogoProps) {
  const sizing = SIZES[size];
  const wordColor = variant === "dark" ? "text-funding-black" : "text-white";

  return (
    <View className={cn("flex-row items-center gap-2.5", className)}>
      <View
        className={cn(
          sizing.mark,
          "rounded-xl bg-funding-accent items-center justify-center shadow-sm"
        )}
      >
        <Ionicons name="leaf" size={sizing.icon} color="#FFFFFF" />
      </View>
      <Text className={cn("font-black tracking-tight", sizing.text, wordColor)}>
        Funding
        <Text className="text-funding-accent">Pro</Text>
      </Text>
    </View>
  );
}
