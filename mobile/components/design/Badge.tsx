import { Text, View } from "react-native";
import { cn } from "../cn";

type BadgeVariant = "default" | "pilot" | "sector" | "urgent" | "soon";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: "bg-funding-light-green", text: "text-funding-green" },
  pilot: { container: "bg-amber-50 border border-amber-200", text: "text-amber-700" },
  sector: { container: "bg-funding-light-green", text: "text-funding-green" },
  urgent: { container: "bg-red-50 border border-red-200", text: "text-red-600" },
  soon: { container: "bg-amber-50 border border-amber-200", text: "text-amber-700" },
};

export function Badge({ label, variant = "default", className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={cn(
        "self-start max-w-full px-2 py-0.5 rounded-full",
        styles.container,
        className
      )}
    >
      <Text className={cn("text-[10px] font-semibold uppercase", styles.text)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
