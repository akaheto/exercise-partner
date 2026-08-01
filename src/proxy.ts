import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_SESSION_COOKIE, verifySiteToken } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/login", "/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail closed: an unconfigured secret must never be treated as "no auth required".
    return new NextResponse("Server misconfigured: SESSION_SECRET is not set", { status: 500 });
  }

  const token = request.cookies.get(SITE_SESSION_COOKIE)?.value;
  if (token && (await verifySiteToken(token, secret))) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Skip Next.js internals, common static file extensions, and the PWA
  // manifest; every actual page and Server Action goes through the check.
  // manifest.webmanifest (src/app/manifest.ts) was missing here until found
  // in a real browser check: a phone fetches it to build the "Add to Home
  // Screen" prompt, gated or not, and it carries no sensitive data (name,
  // icon paths, theme colour) — same posture as favicon.ico already had.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
