import crypto from "crypto";

const AUTH_SALT = process.env.AUTH_SALT || "forge_desktop_salt_2026";
const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
  return crypto.scryptSync(password, AUTH_SALT, KEY_LENGTH).toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const candidate = crypto.scryptSync(password, AUTH_SALT, KEY_LENGTH).toString("hex");
  if (candidate.length !== hash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}
