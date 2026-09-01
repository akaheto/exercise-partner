import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { isLoginLocked, minutesUntilUnlock, nextLoginAttemptState } from "@/lib/login-lockout";

export type LoginLockoutScope = "site" | "admin";

async function getRow(scope: LoginLockoutScope, identifier: string) {
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.scope, scope), eq(loginAttempts.identifier, identifier)));
  return row ?? null;
}

/** Checked before a credential is even compared — see src/lib/
 * login-lockout.ts for why that ordering matters. */
export async function checkLoginLockout(
  scope: LoginLockoutScope,
  identifier: string,
): Promise<{ locked: boolean; minutesRemaining: number }> {
  const row = await getRow(scope, identifier);
  const state = { failedAttempts: row?.failedAttempts ?? 0, lockedUntil: row?.lockedUntil ?? null };
  if (!isLoginLocked(state)) return { locked: false, minutesRemaining: 0 };
  return { locked: true, minutesRemaining: minutesUntilUnlock(state.lockedUntil!) };
}

/** Persists the outcome of one login attempt using the pure state
 * transition in src/lib/login-lockout.ts. */
export async function recordLoginAttempt(
  scope: LoginLockoutScope,
  identifier: string,
  wasCorrect: boolean,
): Promise<void> {
  const row = await getRow(scope, identifier);
  const current = { failedAttempts: row?.failedAttempts ?? 0, lockedUntil: row?.lockedUntil ?? null };
  const next = nextLoginAttemptState(current, wasCorrect);

  if (row) {
    await db
      .update(loginAttempts)
      .set({ failedAttempts: next.failedAttempts, lockedUntil: next.lockedUntil, updatedAt: new Date() })
      .where(eq(loginAttempts.id, row.id));
  } else if (!wasCorrect) {
    // A correct first attempt needs no row at all — nothing to reset.
    await db.insert(loginAttempts).values({ scope, identifier, ...next });
  }
}
