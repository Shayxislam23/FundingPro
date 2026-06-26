/** Expo SecureStore value limit is ~2048 bytes; chunk large session JSON. */
export const SECURE_STORE_CHUNK_SIZE = 2000;
const CHUNK_META_SUFFIX = "__chunk_count";

export function splitSecureStoreValue(value: string, chunkSize = SECURE_STORE_CHUNK_SIZE): string[] {
  if (value.length <= chunkSize) return [value];
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize));
  }
  return chunks;
}

export function joinSecureStoreChunks(chunks: string[]): string {
  return chunks.join("");
}

export function secureStoreChunkMetaKey(key: string): string {
  return `${key}${CHUNK_META_SUFFIX}`;
}

export function secureStoreChunkKey(key: string, index: number): string {
  return `${key}__chunk_${index}`;
}
