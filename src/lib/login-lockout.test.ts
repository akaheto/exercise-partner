import { describe, expect, it } from "vitest";
import {
  LOGIN_LOCKOUT_MINUTES,
  MAX_LOGIN_ATTEMPTS,
  isLoginLocked,
  minutesUntilUnlock,
  nextLoginAttemptState,
} from "./login-lockout";

describe("nextLoginAttemptState", () => {
  it("resets to zero and unlocked on a correct attempt", () => {
    const next = nextLoginAttemptState({ failedAttempts: 4, lockedUntil: null }, true);
    expect(next).toEqual({ failedAttempts: 0, lockedUntil: null });
  });

  it("increments on a wrong attempt without locking below the threshold", () => {
    const next = nextLoginAttemptState({ failedAttempts: 1, lockedUntil: null }, false);
    expect(next.failedAttempts).toBe(2);
    expect(next.lockedUntil).toBeNull();
  });

  it(`locks out for ${LOGIN_LOCKOUT_MINUTES} minutes once MAX_LOGIN_ATTEMPTS is reached`, () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const next = nextLoginAttemptState(
      { failedAttempts: MAX_LOGIN_ATTEMPTS - 1, lockedUntil: null },
      false,
      now,
    );
    expect(next.failedAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(next.lockedUntil).toEqual(new Date(now.getTime() + LOGIN_LOCKOUT_MINUTES * 60_000));
  });

  // A correct attempt must clear a stale lockout, not just the counter, or a
  // caller locked out yesterday stays flagged as locked forever even after
  // finally getting the credential right.
  it("a correct attempt clears an existing lockout, not just the count", () => {
    const next = nextLoginAttemptState(
      { failedAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil: new Date("2099-01-01") },
      true,
    );
    expect(next.lockedUntil).toBeNull();
  });
});

describe("isLoginLocked", () => {
  it("is false with no lockout set", () => {
    expect(isLoginLocked({ failedAttempts: 3, lockedUntil: null })).toBe(false);
  });

  it("is true while lockedUntil is in the future", () => {
    const future = new Date(Date.now() + 60_000);
    expect(isLoginLocked({ failedAttempts: 5, lockedUntil: future })).toBe(true);
  });

  it("is false once lockedUntil has passed", () => {
    const past = new Date(Date.now() - 60_000);
    expect(isLoginLocked({ failedAttempts: 5, lockedUntil: past })).toBe(false);
  });
});

describe("minutesUntilUnlock", () => {
  it("rounds up so a lockout never displays as 0 minutes remaining", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const soon = new Date(now.getTime() + 10_000); // 10 seconds out
    expect(minutesUntilUnlock(soon, now)).toBe(1);
  });

  it("never returns less than 1, even for a date already in the past", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const past = new Date(now.getTime() - 60_000);
    expect(minutesUntilUnlock(past, now)).toBe(1);
  });
});
