import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

type SkeletonProps = {
  className?: string;
  width?: number | `${number}%`;
  height?: number;
  style?: { width?: `${number}%` | number };
};

export function Skeleton({ className, width = "100%", height = 16, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity, width: style?.width ?? width, height }}
      className={cn("rounded-lg bg-clay-inset/80", className)}
    />
  );
}

export function GrantCardSkeleton() {
  return (
    <ClaySurface variant="raised" className="mx-4 mb-3 rounded-[24px] p-4">
      <Skeleton height={20} className="mb-2" style={{ width: "75%" }} />
      <Skeleton height={14} className="mb-3" style={{ width: "50%" }} />
      <View className="flex-row gap-3">
        <Skeleton height={12} width={80} />
        <Skeleton height={12} width={100} />
      </View>
    </ClaySurface>
  );
}

export function GrantListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <GrantCardSkeleton key={i} />
      ))}
    </View>
  );
}
