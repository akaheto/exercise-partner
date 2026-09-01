/**
 * Lockout policy for the site password and admin token logins — both are
 * long-lived shared credentials guessed over the network by an outside
 * attacker, not a 4-6 digit PIN checked by a known profile holder
 * (src/lib/pin.ts has its own policy tuned to that different keyspace/threat
 * model; kept separate so tuning one never silently changes the other).
 * Same 5-attempt/15-minute shape since it's already a proven, unsurprising
 * choice for this app.
 */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

export interface LoginAttemptState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

/** True while a previous lockout is still in effect. Checked before a
 * credential is even compared, so a locked-out caller can't use response
 * timing to keep probing (same stance as src/lib/pin.ts). */
export function isLoginLocked(state: LoginAttemptState, now: Date = new Date()): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

/**
 * Pure state transition for one login attempt — no I/O, unit-testable
 * without a database. A correct attempt always clears the counter and any
 * lockout; a wrong attempt increments it and, once MAX_LOGIN_ATTEMPTS is
 * reached, sets lockedUntil LOGIN_LOCKOUT_MINUTES into the future.
 */
export function nextLoginAttemptState(
  current: LoginAttemptState,
  wasCorrect: boolean,
  now: Date = new Date(),
): LoginAttemptState {
  if (wasCorrect) {
    return { failedAttempts: 0, lockedUntil: null };
  }
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil =
    failedAttempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(now.getTime() + LOGIN_LOCKOUT_MINUTES * 60_000)
      : null;
  return { failedAttempts, lockedUntil };
}

/** Minutes remaining on a lockout, rounded up so "0 minutes left" never
 * displays while still locked. */
export function minutesUntilUnlock(date: Date, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 60_000));
}
