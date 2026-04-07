/**
 * Szyfrowanie pól wrażliwych (np. token KSeF) — tylko Node (Server Actions, Route Handlers, Prisma).
 * Nie importuj z middleware ani z kodu oznaczonego jako Edge.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const AES_256_KEY_BYTES = 32;

function getKey(): Buffer {
  const raw = process.env.KSEF_ENCRYPTION_KEY;
  if (!raw?.trim()) {
    throw new Error("KSEF_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== AES_256_KEY_BYTES) {
    throw new Error(
      `KSEF_ENCRYPTION_KEY must be ${AES_256_KEY_BYTES * 2} hex characters (${AES_256_KEY_BYTES} bytes); got ${key.length} bytes`
    );
  }
  return key;
}

let cachedKey: Buffer | null = null;
function encryptionKey(): Buffer {
  if (!cachedKey) {
    cachedKey = getKey();
  }
  return cachedKey;
}

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivHex, encHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
