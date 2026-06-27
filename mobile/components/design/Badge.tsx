import { Text } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

type BadgeVariant = "default" | "pilot" | "sector" | "urgent" | "soon";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: "bg-clay-inset", text: "text-funding-green" },
  pilot: { container: "bg-clay-inset", text: "text-amber-700" },
  sector: { container: "bg-clay-inset", text: "text-funding-green" },
  urgent: { container: "bg-clay-inset", text: "text-red-600" },
  soon: { container: "bg-clay-inset", text: "text-amber-700" },
};

export function Badge({ label, variant = "default", className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <ClaySurface
      variant="inset"
      radius="pill"
      className={cn("self-start max-w-full px-2 py-0.5", styles.container, className)}
    >
      <Text className={cn("text-[10px] font-semibold uppercase", styles.text)} numberOfLines={1}>
        {label}
      </Text>
    </ClaySurface>
  );
}
