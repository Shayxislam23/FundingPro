import { Text } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

type DonorAvatarProps = {
  name: string;
  nameRu?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const AVATAR_COLORS = [
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
] as const;

const SIZES = {
  sm: { box: "w-10 h-10", radius: 12, text: "text-sm" },
  md: { box: "w-12 h-12", radius: 14, text: "text-base" },
  lg: { box: "w-14 h-14", radius: 16, text: "text-lg" },
} as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitial(name: string, nameRu?: string | null): string {
  const source = (nameRu ?? name).trim();
  if (!source) return "?";
  const first = source.charAt(0);
  return first.toUpperCase();
}

export function DonorAvatar({ name, nameRu, size = "md", className }: DonorAvatarProps) {
  const palette = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length]!;
  const sizing = SIZES[size];
  const initial = getInitial(name, nameRu);

  return (
    <ClaySurface
      variant="raised"
      radius={sizing.radius}
      className={cn(sizing.box, palette.bg, "items-center justify-center shrink-0", className)}
    >
      <Text className={cn(sizing.text, palette.text, "font-bold")}>{initial}</Text>
    </ClaySurface>
  );
}
