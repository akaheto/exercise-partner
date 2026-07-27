/**
 * Site-wide password gate. This is a single shared credential protecting the
 * whole app from the public internet — not a per-user auth system. See
 * TECHNICAL_SPEC.docx "Key Decisions & Tradeoffs" for why.
 *
 * Uses Web Crypto (not Node's `crypto` module) so the same code runs
 * unchanged in both the Edge and Node.js middleware runtimes.
 */
export const SITE_SESSION_COOKIE = "site_session";
const TOKEN_MESSAGE = "exercise-partner-site-session-v1";

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

/** The cookie value issued after a successful login. */
export function signSiteToken(secret: string): Promise<string> {
  return hmac(secret, TOKEN_MESSAGE);
}

/** Constant-time string comparison — avoids leaking match length via timing. */
function constantTimeEqual(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLength; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function verifySiteToken(token: string, secret: string): Promise<boolean> {
  const expected = await signSiteToken(secret);
  return constantTimeEqual(token, expected);
}

export function verifySitePassword(submitted: string, sitePassword: string): boolean {
  return constantTimeEqual(submitted, sitePassword);
}
