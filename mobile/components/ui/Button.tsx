import { Pressable, Text, type PressableProps } from "react-native";
import { safeImpactAsync } from "../../lib/haptics";
import { cn } from "../cn";

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  haptic?: boolean;
  className?: string;
};

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  haptic = false,
  className,
  onPress,
  ...props
}: ButtonProps) {
  const base = "min-h-[48px] rounded-xl px-4 py-3 items-center justify-center active:scale-[0.98]";
  const variants = {
    primary: "bg-funding-green shadow-button",
    secondary: "border border-funding-green bg-white",
    ghost: "bg-transparent",
    danger: "bg-red-600 shadow-elevated",
  };
  const textVariants = {
    primary: "text-white font-semibold text-body",
    secondary: "text-funding-green font-semibold text-body",
    ghost: "text-funding-green font-medium text-body",
    danger: "text-white font-semibold text-body",
  };

  async function handlePress(event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) {
    if (haptic && variant === "primary") {
      await safeImpactAsync();
    }
    onPress?.(event);
  }

  return (
    <Pressable
      className={cn(base, variants[variant], (disabled || loading) && "opacity-60", className)}
      disabled={disabled || loading}
      onPress={handlePress}
      {...props}
    >
      <Text className={textVariants[variant]}>{loading ? "…" : title}</Text>
    </Pressable>
  );
}
