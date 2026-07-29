import crypto from "crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = "sha256";

/** Deletion-lockout policy. 5 wrong guesses exhausts a 4-digit PIN's
 * remaining keyspace slowly enough (a 15-minute wait every 5 tries) to make
 * brute force impractical, without locking a person out over one fat-fingered
 * attempt. */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MINUTES = 15;

/**
 * Random salt for one profile's PIN, generated once at profile creation and
 * stored alongside the hash in profiles.pin_salt.
 *
 * Every profile used to share a single hardcoded salt ("exercise-partner-
 * salt"), so identical PINs produced identical hashes — anyone with database
 * read access could see which profiles shared a PIN, and one precomputed
 * table covered the whole 4-6 digit keyspace for every profile at once. A
 * distinct random salt per profile means each one has to be attacked
 * separately.
 */
export function generatePinSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** Hash a PIN with PBKDF2 using the given per-profile salt. */
export function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
}

/**
 * Verify a PIN against its stored salt and hash, in constant time so a near
 * miss and a wildly wrong guess take the same time to reject — a naive `===`
 * comparison leaks how many leading bytes matched through timing.
 */
export function verifyPin(pin: string, salt: string, hash: string): boolean {
  const candidate = Buffer.from(hashPin(pin, salt), "hex");
  const expected = Buffer.from(hash, "hex");
  // PBKDF2 output length is fixed, so these are always equal in practice;
  // timingSafeEqual throws rather than returning false on a length
  // mismatch, so guard first and fail safe on a corrupt/malformed hash
  // instead of crashing the request.
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export interface PinAttemptState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

/** True while a previous lockout is still in effect. Checked before a guess
 * is even hashed, so a locked-out caller can't use response timing to keep
 * probing. */
export function isPinLocked(state: PinAttemptState, now: Date = new Date()): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

/**
 * Pure state transition for one PIN attempt — no I/O, so it's unit-testable
 * without a database. A correct guess always clears the counter and any
 * lockout; a wrong guess increments it and, once MAX_PIN_ATTEMPTS is
 * reached, sets lockedUntil PIN_LOCKOUT_MINUTES into the future.
 */
export function nextPinAttemptState(
  current: PinAttemptState,
  wasCorrect: boolean,
  now: Date = new Date(),
): PinAttemptState {
  if (wasCorrect) {
    return { failedAttempts: 0, lockedUntil: null };
  }
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil =
    failedAttempts >= MAX_PIN_ATTEMPTS
      ? new Date(now.getTime() + PIN_LOCKOUT_MINUTES * 60_000)
      : null;
  return { failedAttempts, lockedUntil };
}

/** Minutes remaining on a lockout, rounded up so "0 minutes left" never
 * displays while still locked. */
export function minutesUntil(date: Date, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 60_000));
}
