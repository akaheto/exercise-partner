import { describe, expect, it } from "vitest";
import {
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_MINUTES,
  generatePinSalt,
  hashPin,
  isPinLocked,
  isValidPin,
  minutesUntil,
  nextPinAttemptState,
  verifyPin,
} from "./pin";

describe("hashPin / verifyPin", () => {
  it("verifies a correct pin against its own salt", () => {
    const salt = generatePinSalt();
    expect(verifyPin("1234", salt, hashPin("1234", salt))).toBe(true);
  });

  it("rejects an incorrect pin", () => {
    const salt = generatePinSalt();
    expect(verifyPin("9999", salt, hashPin("1234", salt))).toBe(false);
  });

  it("does not store the pin in plaintext", () => {
    const salt = generatePinSalt();
    expect(hashPin("1234", salt)).not.toContain("1234");
  });

  // The whole point of salting: two profiles that happen to choose the same
  // PIN must not be discoverable as such by comparing pin_hash values.
  it("produces different hashes for the same pin under different salts", () => {
    const saltA = generatePinSalt();
    const saltB = generatePinSalt();
    expect(hashPin("1234", saltA)).not.toBe(hashPin("1234", saltB));
  });

  it("rejects a hash produced under a different salt, even for the same pin", () => {
    const saltA = generatePinSalt();
    const saltB = generatePinSalt();
    expect(verifyPin("1234", saltB, hashPin("1234", saltA))).toBe(false);
  });

  it("generates a fresh salt every call", () => {
    expect(generatePinSalt()).not.toBe(generatePinSalt());
  });

  // Migration 0008 backfills pin_salt = "exercise-partner-salt" (the old
  // hardcoded value) onto every profile created before per-profile salting
  // existed, so their PIN keeps verifying instead of locking them out. That
  // only works if hashPin(pin, "exercise-partner-salt") still reproduces
  // exactly what the pre-migration implementation produced. This fixture is
  // that old implementation's real output for pin "1234" — if PBKDF2's
  // iteration count, key length or digest ever changes, this is the test
  // that catches it before it silently breaks every pre-migration profile's
  // ability to delete itself.
  it("reproduces the pre-migration hash under the backfilled legacy salt", () => {
    const legacyHash =
      "dc55adeb7a618e39f3f37f32588dd3442f94a83771e6b87df85633175e126996d7525b2eef16fc7c98384e779e3ac1a38c85a7a022cc180718b0d167fbcddf83";
    expect(hashPin("1234", "exercise-partner-salt")).toBe(legacyHash);
    expect(verifyPin("1234", "exercise-partner-salt", legacyHash)).toBe(true);
  });
});

describe("isValidPin", () => {
  it("accepts 4-6 digit pins", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
  });

  it("rejects pins that are too short, too long, or non-numeric", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});

describe("nextPinAttemptState", () => {
  it("resets to zero and unlocked on a correct guess", () => {
    const next = nextPinAttemptState({ failedAttempts: 4, lockedUntil: null }, true);
    expect(next).toEqual({ failedAttempts: 0, lockedUntil: null });
  });

  it("increments on a wrong guess without locking below the threshold", () => {
    const next = nextPinAttemptState({ failedAttempts: 1, lockedUntil: null }, false);
    expect(next.failedAttempts).toBe(2);
    expect(next.lockedUntil).toBeNull();
  });

  it(`locks out for ${PIN_LOCKOUT_MINUTES} minutes once MAX_PIN_ATTEMPTS is reached`, () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const next = nextPinAttemptState(
      { failedAttempts: MAX_PIN_ATTEMPTS - 1, lockedUntil: null },
      false,
      now,
    );
    expect(next.failedAttempts).toBe(MAX_PIN_ATTEMPTS);
    expect(next.lockedUntil).toEqual(new Date(now.getTime() + PIN_LOCKOUT_MINUTES * 60_000));
  });

  // A correct guess must clear a stale lockout, not just the counter, or a
  // profile that was locked out yesterday would stay flagged as locked
  // forever even after a right answer.
  it("a correct guess clears an existing lockout, not just the count", () => {
    const next = nextPinAttemptState(
      { failedAttempts: MAX_PIN_ATTEMPTS, lockedUntil: new Date("2099-01-01") },
      true,
    );
    expect(next.lockedUntil).toBeNull();
  });
});

describe("isPinLocked", () => {
  it("is false with no lockout set", () => {
    expect(isPinLocked({ failedAttempts: 3, lockedUntil: null })).toBe(false);
  });

  it("is true while lockedUntil is in the future", () => {
    const future = new Date(Date.now() + 60_000);
    expect(isPinLocked({ failedAttempts: 5, lockedUntil: future })).toBe(true);
  });

  it("is false once lockedUntil has passed", () => {
    const past = new Date(Date.now() - 60_000);
    expect(isPinLocked({ failedAttempts: 5, lockedUntil: past })).toBe(false);
  });
});

describe("minutesUntil", () => {
  it("rounds up so a lockout never displays as 0 minutes remaining", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const soon = new Date(now.getTime() + 10_000); // 10 seconds out
    expect(minutesUntil(soon, now)).toBe(1);
  });

  it("never returns less than 1, even for a date already in the past", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const past = new Date(now.getTime() - 60_000);
    expect(minutesUntil(past, now)).toBe(1);
  });
});
