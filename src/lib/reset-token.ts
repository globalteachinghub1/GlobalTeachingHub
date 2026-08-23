import { randomBytes, createHash } from "node:crypto";

const TOKEN_BYTES = 32;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken() {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  return { token, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + EXPIRY_MS) };
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
