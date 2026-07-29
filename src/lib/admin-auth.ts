/**
 * Admin session, signed.
 *
 * The previous implementation set `admin_session` to the literal string
 * "authenticated" and admitted anyone who presented it, so one hand-set
 * cookie granted full admin access — including deleting any profile and its
 * entire training history — without ever supplying ADMIN_TOKEN. This module
 * replaces that with the same HMAC pattern src/lib/auth.ts has used for the
 * site gate since Epic C.
 *
 * Two properties the old cookie lacked:
 *
 *  - it is unforgeable without SESSION_SECRET;
 *  - the 4-hour expiry is inside the signed payload, so it is enforced by the
 *    server rather than by a cookie `maxAge` the client is free to ignore.
 *
 * Uses Web Crypto, matching src/lib/auth.ts, so the same code runs in both the
 * Edge and Node.js runtimes.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";

/** Distinct from the site gate's message, so a site token cannot be replayed
 * as an admin token even though both are signed with SESSION_SECRET. */
const TOKEN_PREFIX = "exercise-partner-admin-session-v1";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison — avoids leaking match length via timing. */
export function constantTimeEqual(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLength; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** `<expiry-epoch-seconds>.<signature>` */
export async function signAdminToken(secret: string, expiresAtSeconds: number): Promise<string> {
  const signature = await hmac(secret, `${TOKEN_PREFIX}:${expiresAtSeconds}`);
  return `${expiresAtSeconds}.${signature}`;
}

export function adminTokenExpiry(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
}

/**
 * True only for a token this server signed and that has not yet expired.
 * Any malformed input is a plain false, never a throw — a garbage cookie is
 * an unauthenticated request, not a 500.
 */
export async function verifyAdminToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator <= 0) return false;

  const expiryPart = token.slice(0, separator);
  if (!/^\d+$/.test(expiryPart)) return false;

  const expiresAtSeconds = Number(expiryPart);
  if (!Number.isSafeInteger(expiresAtSeconds)) return false;
  if (expiresAtSeconds * 1000 <= nowMs) return false;

  const expected = await signAdminToken(secret, expiresAtSeconds);
  return constantTimeEqual(token, expected);
}
