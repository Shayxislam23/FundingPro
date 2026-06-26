import type { ComponentType, ReactNode } from "react";
import { UIManager, View, type ViewProps } from "react-native";
import { cn } from "../cn";

type GradientPoint = { x: number; y: number };

type LinearGradientProps = ViewProps & {
  colors: string[];
  start?: GradientPoint;
  end?: GradientPoint;
  locations?: number[];
};

type GradientHeroProps = ViewProps & {
  variant?: "hero" | "strip" | "card" | "soft";
  colors?: string[];
  start?: GradientPoint;
  end?: GradientPoint;
  children?: ReactNode;
};

const VARIANT_DEFAULTS: Record<
  NonNullable<GradientHeroProps["variant"]>,
  { colors: string[]; className: string; start?: GradientPoint; end?: GradientPoint }
> = {
  hero: {
    colors: ["#008A2E", "#12B94F"],
    className: "px-5 pt-6 pb-10 rounded-b-3xl bg-funding-green overflow-hidden",
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  strip: {
    colors: ["#008A2E", "#12B94F"],
    className: "h-1.5 bg-funding-green",
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  card: {
    colors: ["#008A2E", "#12B94F"],
    className: "rounded-2xl p-6 bg-funding-green",
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  soft: {
    colors: ["#D9F7DD", "#F7FAF7"],
    className: "rounded-2xl p-5 bg-funding-light-green",
  },
};

function isLinearGradientNativeAvailable(): boolean {
  try {
    return (
      UIManager.getViewManagerConfig?.("ExpoLinearGradient") != null ||
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoLinearGradient") != null
    );
  } catch {
    return false;
  }
}

let cachedLinearGradient: ComponentType<LinearGradientProps> | null | undefined;

function getLinearGradientComponent(): ComponentType<LinearGradientProps> | null {
  if (cachedLinearGradient !== undefined) {
    return cachedLinearGradient;
  }

  if (!isLinearGradientNativeAvailable()) {
    cachedLinearGradient = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedLinearGradient = require("expo-linear-gradient").LinearGradient as ComponentType<LinearGradientProps>;
  } catch {
    cachedLinearGradient = null;
  }

  return cachedLinearGradient;
}

/** Green header / accent strip with expo-linear-gradient when native module exists, else solid View. */
export function GradientHero({
  variant = "hero",
  colors,
  start,
  end,
  className,
  children,
  ...rest
}: GradientHeroProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const resolvedColors = colors ?? defaults.colors;
  const resolvedStart = start ?? defaults.start;
  const resolvedEnd = end ?? defaults.end;
  const mergedClassName = cn(defaults.className, className);

  const LinearGradient = getLinearGradientComponent();

  const patternOverlay =
    variant === "hero" ? (
      <View className="absolute inset-0 opacity-[0.08] bg-white" pointerEvents="none" />
    ) : null;

  if (LinearGradient) {
    return (
      <LinearGradient
        colors={resolvedColors}
        start={resolvedStart}
        end={resolvedEnd}
        className={mergedClassName}
        {...rest}
      >
        {patternOverlay}
        {children}
      </LinearGradient>
    );
  }

  return (
    <View className={mergedClassName} {...rest}>
      {patternOverlay}
      {children}
    </View>
  );
}
