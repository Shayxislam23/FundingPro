import { Pressable, View, type PressableProps, type PressableStateCallbackType, type ViewProps } from "react-native";
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

type ClayPressableProps = PressableProps & {
  variant?: ClayVariant;
  className?: string;
  radius?: keyof typeof CLAY_RADIUS | number;
};

export function ClayPressable({
  variant = "raised",
  className,
  style,
  radius,
  children,
  ...props
}: ClayPressableProps) {
  const borderRadius = resolveRadius(radius);

  return (
    <Pressable
      className={className}
      style={(state: PressableStateCallbackType) => [
        getClayStyle(state.pressed ? "pressed" : variant),
        borderRadius !== undefined ? { borderRadius } : null,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
