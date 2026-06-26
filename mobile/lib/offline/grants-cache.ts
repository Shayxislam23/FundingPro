import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ListGrantsResult } from "@fundingpro/api-types";

const GRANTS_CACHE_KEY = "fundingpro:grants-cache";

export async function loadGrantsCache(): Promise<ListGrantsResult | null> {
  try {
    const raw = await AsyncStorage.getItem(GRANTS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListGrantsResult;
  } catch {
    return null;
  }
}

export async function saveGrantsCache(data: ListGrantsResult): Promise<void> {
  try {
    await AsyncStorage.setItem(GRANTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
