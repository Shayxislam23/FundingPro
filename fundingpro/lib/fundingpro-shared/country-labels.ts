const COUNTRY_MAP: Record<string, string> = {
  uzbekistan: "Узбекистан",
  kazakhstan: "Казахстан",
  kyrgyzstan: "Кыргызстан",
  tajikistan: "Таджикистан",
  turkmenistan: "Туркменистан",
  afghanistan: "Афганистан",
  germany: "Германия",
  switzerland: "Швейцария",
  international: "Международный",
  "european union": "Европейский Союз",
  europe: "Европа",
  "central asia": "Центральная Азия",
  usa: "США",
  "united states": "США",
  russia: "Россия",
  china: "Китай",
  india: "Индия",
  uk: "Великобритания",
  "united kingdom": "Великобритания",
};

/**
 * Returns a human-readable Russian country name.
 * Falls back to the raw value when no translation exists.
 */
export function translateCountry(raw: string): string {
  if (!raw) return "—";
  const key = raw.toLowerCase().trim();
  if (COUNTRY_MAP[key]) return COUNTRY_MAP[key];
  return raw;
}
