import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cn } from "../cn";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  className?: string;
};

export function OtpInput({ value, onChange, length = 6, autoFocus, className }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
  }

  return (
    <View className={cn("relative", className)}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        maxLength={length}
        className="absolute opacity-0 w-full h-full"
        caretHidden
      />
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="flex-row justify-between gap-2"
      >
        {digits.map((digit, index) => (
          <View
            key={index}
            className={cn(
              "flex-1 aspect-square max-w-[48px] rounded-xl border-2 items-center justify-center bg-white",
              digit.trim() ? "border-funding-green" : "border-gray-200",
              index === value.length && "border-funding-accent"
            )}
          >
            <Text className="text-xl font-bold text-funding-black">{digit.trim() || ""}</Text>
          </View>
        ))}
      </Pressable>
    </View>
  );
}
