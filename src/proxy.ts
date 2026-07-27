import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_SESSION_COOKIE, verifySiteToken } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/login"];

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
  // Skip Next.js internals and common static file extensions; every actual
  // page and Server Action goes through the check.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
