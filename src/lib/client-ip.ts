import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort caller identity for rate limiting a shared-credential login
 * (src/lib/login-lockout.ts) where there's no per-user account to key off.
 * Vercel sets x-forwarded-for to the real client IP; a request with neither
 * header falls into a single shared "unknown" bucket rather than skipping
 * rate limiting entirely.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerList.get("x-real-ip")?.trim() || "unknown";
}
