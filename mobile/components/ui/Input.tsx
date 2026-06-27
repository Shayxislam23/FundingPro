import { TextInput, type TextInputProps } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <ClaySurface variant="inset" radius="input" className="overflow-hidden">
      <TextInput
        className={cn("px-4 py-3 text-funding-black bg-transparent", className)}
        placeholderTextColor="#6B7F70"
        {...props}
      />
    </ClaySurface>
  );
}
