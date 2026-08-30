"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_SESSION_COOKIE, signSiteToken, verifySitePassword } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 180;

/**
 * Verifies the single shared site password and, on success, sets the
 * site_session cookie every non-admin route requires (src/proxy.ts).
 *
 * A 2026-07-30 "login redesign" replaced this with a profile-name+PIN form
 * that never set this cookie, so no route past /login was reachable by
 * anyone from that point until this fix — see
 * docs/technical/lessons-learned.md. Profile selection itself (click an
 * existing profile, or "Add a profile") already lives on `/`
 * (ProfileSelector) and needs no separate credential — this form's only
 * job is the one shared site-wide gate.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const nextParam = String(formData.get("next") ?? "/");
  const next = nextParam.startsWith("/") ? nextParam : "/";

  const sitePassword = process.env.SITE_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!sitePassword || !secret) {
    return { error: "Site is not configured for login. Check SITE_PASSWORD and SESSION_SECRET in .env." };
  }

  if (!verifySitePassword(password, sitePassword)) {
    return { error: "Incorrect password." };
  }

  const token = await signSiteToken(secret);
  const cookieStore = await cookies();
  cookieStore.set(SITE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SIX_MONTHS_IN_SECONDS,
    path: "/",
  });

  redirect(next);
}
