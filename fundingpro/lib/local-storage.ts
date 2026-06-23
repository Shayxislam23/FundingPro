import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), ".local", "uploads");

export function getLocalUploadPath(storageKey: string): string {
  const safe = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(UPLOAD_ROOT, safe);
}

export async function saveLocalFile(storageKey: string, data: ArrayBuffer): Promise<void> {
  const filePath = getLocalUploadPath(storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(data));
}

export async function readLocalFile(storageKey: string): Promise<Buffer | null> {
  const filePath = getLocalUploadPath(storageKey);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteLocalFile(storageKey: string): Promise<void> {
  const filePath = getLocalUploadPath(storageKey);
  try {
    await fs.unlink(filePath);
  } catch {
    /* ignore */
  }
}
