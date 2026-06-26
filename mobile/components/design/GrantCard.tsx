import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import {
  formatDeadlineDisplay,
  formatGrantAmount,
  getDeadlineUrgency,
  translateCountry,
  translateSector,
} from "@fundingpro/shared";
import type { GrantListItem } from "@fundingpro/api-types";
import { cn } from "../cn";
import { Badge } from "./Badge";

type GrantCardProps = {
  grant: GrantListItem;
  onPress?: () => void;
  compact?: boolean;
  className?: string;
};

function getSectorLabel(sectors: string[]): string | undefined {
  if (!sectors.length) return undefined;
  return translateSector(sectors[0] ?? "");
}

export function GrantCard({ grant, onPress, compact, className }: GrantCardProps) {
  const title = grant.title_ru ?? grant.title;
  const donor = grant.donor.name_ru ?? grant.donor.name;
  const deadline = formatDeadlineDisplay(grant.deadline);
  const amount = formatGrantAmount(grant.amount_min, grant.amount_max);
  const urgency = getDeadlineUrgency(grant.deadline);
  const sector = getSectorLabel(grant.sectors);
  const country = grant.country_scope[0] ? translateCountry(grant.country_scope[0]) : undefined;

  const content = (
    <View
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-card",
        compact ? "p-3" : "p-5",
        className
      )}
    >
      <View className="flex-row items-start justify-between gap-2 mb-3">
        <View className="flex-1 min-w-0">
          <View className="flex-row items-start gap-2 flex-wrap">
            <Text
              className="flex-1 min-w-0 font-semibold text-headline text-funding-black leading-snug"
              numberOfLines={2}
            >
              {title}
            </Text>
            {compact && sector ? <Badge label={sector} variant="sector" /> : null}
          </View>
          <Text className="text-sm font-medium text-funding-green mt-1">{donor}</Text>
        </View>
        <View className="flex-row gap-1 shrink-0">
          {urgency === "urgent" && <Badge label="Срочно" variant="urgent" />}
          {urgency === "soon" && <Badge label="Скоро" variant="soon" />}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 items-baseline">
        {amount !== "—" && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="cash-outline" size={14} color="#4A5A4D" />
            <Text className="text-caption text-funding-text-muted-light">{amount}</Text>
          </View>
        )}
        {grant.deadline && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={14} color="#4A5A4D" />
            <Text className="text-caption text-funding-text-muted-light">{deadline}</Text>
          </View>
        )}
        {country && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={14} color="#4A5A4D" />
            <Text className="text-caption text-funding-text-muted-light">{country}</Text>
          </View>
        )}
      </View>

      {sector && !compact ? (
        <View className="mt-3">
          <Badge label={sector} variant="sector" />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:scale-[0.98]">
        {content}
      </Pressable>
    );
  }

  return content;
}
