import * as SecureStore from "expo-secure-store";
import {
  SECURE_STORE_CHUNK_SIZE,
  joinSecureStoreChunks,
  secureStoreChunkKey,
  secureStoreChunkMetaKey,
  splitSecureStoreValue,
} from "./secure-store-chunking";

async function removeChunked(key: string): Promise<void> {
  const metaKey = secureStoreChunkMetaKey(key);
  const countStr = await SecureStore.getItemAsync(metaKey);
  if (countStr) {
    const count = Number.parseInt(countStr, 10);
    if (Number.isFinite(count) && count > 0) {
      await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(secureStoreChunkKey(key, i)))
      );
    }
    await SecureStore.deleteItemAsync(metaKey);
  }
}

export const chunkedSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const direct = await SecureStore.getItemAsync(key);
    if (direct !== null) return direct;

    const metaKey = secureStoreChunkMetaKey(key);
    const countStr = await SecureStore.getItemAsync(metaKey);
    if (!countStr) return null;

    const count = Number.parseInt(countStr, 10);
    if (!Number.isFinite(count) || count <= 0) return null;

    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(secureStoreChunkKey(key, i));
      if (part === null) return null;
      chunks.push(part);
    }
    return joinSecureStoreChunks(chunks);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await removeChunked(key);

    if (value.length <= SECURE_STORE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = splitSecureStoreValue(value);
    await SecureStore.setItemAsync(secureStoreChunkMetaKey(key), String(chunks.length));
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(secureStoreChunkKey(key, i), chunk))
    );
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await removeChunked(key);
  },
};
