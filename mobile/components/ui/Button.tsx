import { Pressable, Text, type PressableProps } from "react-native";
import { getClayStyle, getPrimaryButtonClayStyle } from "../../lib/clay-styles";
import { safeImpactAsync } from "../../lib/haptics";
import { ClaySurface } from "../clay/ClaySurface";
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
  const base = "min-h-[48px] rounded-[18px] px-4 py-3 items-center justify-center";
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

  if (variant === "ghost") {
    return (
      <Pressable
        className={cn(base, (disabled || loading) && "opacity-60", className)}
        disabled={disabled || loading}
        onPress={handlePress}
        {...props}
      >
        <Text className={textVariants.ghost}>{loading ? "…" : title}</Text>
      </Pressable>
    );
  }

  if (variant === "primary") {
    return (
      <Pressable
        className={cn(base, (disabled || loading) && "opacity-60", className)}
        disabled={disabled || loading}
        onPress={handlePress}
        style={({ pressed }) => [
          getPrimaryButtonClayStyle(),
          { borderRadius: 18 },
          pressed ? { opacity: 0.92, transform: [{ scale: 0.98 }] } : null,
        ]}
        {...props}
      >
        <Text className={textVariants.primary}>{loading ? "…" : title}</Text>
      </Pressable>
    );
  }

  if (variant === "danger") {
    return (
      <Pressable
        className={cn(base, "bg-red-600", (disabled || loading) && "opacity-60", className)}
        disabled={disabled || loading}
        onPress={handlePress}
        style={{ borderRadius: 18 }}
        {...props}
      >
        <Text className={textVariants.danger}>{loading ? "…" : title}</Text>
      </Pressable>
    );
  }

  return (
    <ClaySurface variant="raised" radius="button" className={cn("overflow-hidden", className)}>
      <Pressable
        className={cn(base, (disabled || loading) && "opacity-60")}
        disabled={disabled || loading}
        onPress={handlePress}
        style={({ pressed }) => (pressed ? getClayStyle("pressed") : undefined)}
        {...props}
      >
        <Text className={textVariants.secondary}>{loading ? "…" : title}</Text>
      </Pressable>
    </ClaySurface>
  );
}
