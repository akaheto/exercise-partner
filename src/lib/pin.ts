import crypto from "crypto";

/**
 * Hash a PIN using PBKDF2
 */
export function hashPin(pin: string): string {
  const salt = "exercise-partner-salt"; // Fixed salt for deterministic hashing
  return crypto.pbkdf2Sync(pin, salt, 100000, 64, "sha256").toString("hex");
}

/**
 * Verify a PIN against its hash
 */
export function verifyPin(pin: string, pinHash: string): boolean {
  return hashPin(pin) === pinHash;
}

/**
 * Validate PIN format (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
