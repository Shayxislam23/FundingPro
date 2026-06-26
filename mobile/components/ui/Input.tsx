import { TextInput, type TextInputProps } from "react-native";
import { cn } from "../cn";

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn("rounded-xl border border-gray-300 bg-white px-4 py-3 text-funding-black", className)}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  );
}
