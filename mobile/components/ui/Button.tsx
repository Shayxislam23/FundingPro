import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "../cn";

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  className?: string;
};

export function Button({ title, variant = "primary", loading, disabled, className, ...props }: ButtonProps) {
  const base = "rounded-xl px-4 py-3 items-center justify-center";
  const variants = {
    primary: "bg-funding-green",
    secondary: "border border-funding-green bg-white",
    ghost: "bg-transparent",
    danger: "bg-red-600",
  };
  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-funding-green font-semibold",
    ghost: "text-funding-green font-medium",
    danger: "text-white font-semibold",
  };

  return (
    <Pressable
      className={cn(base, variants[variant], (disabled || loading) && "opacity-60", className)}
      disabled={disabled || loading}
      {...props}
    >
      <Text className={textVariants[variant]}>{loading ? "…" : title}</Text>
    </Pressable>
  );
}
