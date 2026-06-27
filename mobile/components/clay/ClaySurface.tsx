import { View, type ViewProps } from "react-native";
import { CLAY_RADIUS, getClayStyle, type ClayVariant } from "../../lib/clay-styles";

type ClaySurfaceProps = ViewProps & {
  variant?: ClayVariant;
  className?: string;
  radius?: keyof typeof CLAY_RADIUS | number;
  active?: boolean;
};

function resolveRadius(radius: ClaySurfaceProps["radius"]): number | undefined {
  if (radius === undefined) return undefined;
  if (typeof radius === "number") return radius;
  return CLAY_RADIUS[radius];
}

export function ClaySurface({
  variant = "raised",
  className,
  style,
  radius,
  active,
  children,
  ...props
}: ClaySurfaceProps) {
  const clayStyle = getClayStyle(active ? "pressed" : variant);
  const borderRadius = resolveRadius(radius);

  return (
    <View
      className={className}
      style={[clayStyle, borderRadius !== undefined ? { borderRadius } : null, style]}
      {...props}
    >
      {children}
    </View>
  );
}
