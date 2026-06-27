import { Platform, type ViewStyle } from "react-native";

export const CLAY_COLORS = {
  canvas: "#E8F0EA",
  surface: "#F4FAF5",
  inset: "#DCE8DE",
  highlight: "rgba(255, 255, 255, 0.72)",
  shadow: "rgba(0, 80, 30, 0.12)",
  shadowDark: "rgba(0, 50, 20, 0.18)",
  green: "#008A2E",
  greenDark: "#006B24",
} as const;

export type ClayVariant = "raised" | "inset" | "dock" | "pressed";

export const CLAY_RADIUS = {
  card: 24,
  button: 18,
  input: 18,
  pill: 16,
  dock: 28,
} as const;

function raisedShadow(): ViewStyle {
  return (
    Platform.select({
      ios: {
        shadowColor: CLAY_COLORS.shadowDark,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      default: {},
    }) ?? {}
  );
}

function dockShadow(): ViewStyle {
  return (
    Platform.select({
      ios: {
        shadowColor: CLAY_COLORS.shadowDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
      default: {},
    }) ?? {}
  );
}

function primaryButtonShadow(): ViewStyle {
  return (
    Platform.select({
      ios: {
        shadowColor: CLAY_COLORS.greenDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      default: {},
    }) ?? {}
  );
}

export function getClayStyle(variant: ClayVariant): ViewStyle {
  switch (variant) {
    case "raised":
      return {
        backgroundColor: CLAY_COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: CLAY_COLORS.highlight,
        ...raisedShadow(),
      };
    case "inset":
      return {
        backgroundColor: CLAY_COLORS.inset,
        borderWidth: 1,
        borderColor: "rgba(0, 80, 30, 0.1)",
      };
    case "dock":
      return {
        backgroundColor: CLAY_COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: CLAY_COLORS.highlight,
        ...dockShadow(),
      };
    case "pressed":
      return {
        backgroundColor: CLAY_COLORS.inset,
        borderWidth: 1,
        borderColor: "rgba(0, 80, 30, 0.12)",
      };
    default:
      return {};
  }
}

export function getPrimaryButtonClayStyle(): ViewStyle {
  return {
    backgroundColor: CLAY_COLORS.green,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.28)",
    ...primaryButtonShadow(),
  };
}
