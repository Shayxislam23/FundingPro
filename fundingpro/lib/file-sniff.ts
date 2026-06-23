const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: "application/msword", bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { mime: "application/vnd.ms-excel", bytes: [0xd0, 0xcf, 0x11, 0xe0] },
];

const ALLOWED_MIMES = new Set(SIGNATURES.map((s) => s.mime));

export function isAllowedUploadMime(mime: string): boolean {
  return ALLOWED_MIMES.has(mime);
}

export function detectMimeFromBytes(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => bytes[i] === b)) {
      return sig.mime;
    }
  }
  return null;
}

/** Returns null if declared MIME matches sniffed content (or sniff is inconclusive for legacy OLE). */
export function validateFileContent(declaredMime: string, buffer: ArrayBuffer): string | null {
  if (!isAllowedUploadMime(declaredMime)) {
    return "File type not allowed";
  }

  const sniffed = detectMimeFromBytes(buffer);
  if (!sniffed) {
    return null;
  }

  const oleFamily = new Set([
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);

  if (oleFamily.has(declaredMime) && oleFamily.has(sniffed)) {
    return null;
  }

  if (sniffed !== declaredMime) {
    return "File content does not match declared type";
  }

  return null;
}
