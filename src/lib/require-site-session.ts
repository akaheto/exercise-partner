import "server-only";
import { cookies } from "next/headers";
import { SITE_SESSION_COOKIE, verifySiteToken } from "@/lib/auth";

/**
 * Server Actions are reachable directly by request, independent of Proxy's
 * route matching — a matcher change or route refactor can silently stop
 * protecting one without the other (this is called out in Next.js's own
 * Proxy docs). Every Server Action that touches app data calls this first
 * rather than relying on Proxy alone.
 *
 * Kept out of src/lib/auth.ts (which src/proxy.ts also imports) so
 * `next/headers` — a Server Component/Action-only API — never ends up in the
 * Proxy bundle.
 */
export async function requireSiteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SITE_SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  if (!secret) throw new Error("SESSION_SECRET is not set");
  if (!token || !(await verifySiteToken(token, secret))) {
    throw new Error("Not authenticated");
  }
}
