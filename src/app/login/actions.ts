"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_SESSION_COOKIE, signSiteToken, verifySitePassword } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 180;

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
