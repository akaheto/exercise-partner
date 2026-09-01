"use server";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminTokenExpiry,
  constantTimeEqual,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/client-ip";
import { checkLoginLockout, recordLoginAttempt } from "@/lib/login-lockout-store";

/**
 * Reads a required secret, or throws.
 *
 * These used to fall back to "change-me" / "change-me-in-production", so a
 * deployment with the variables unset was reachable with publicly-known
 * credentials instead of failing closed — and ADMIN_TOKEN was in fact unset
 * on this project. src/proxy.ts already refuses to serve without
 * SESSION_SECRET; this is the same stance for the admin gate.
 */
function requireSecret(name: "SITE_PASSWORD" | "ADMIN_TOKEN" | "SESSION_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — the admin gate refuses to run without it`);
  }
  return value;
}

export async function validateAdminAccess(
  sitePassword: string,
  adminToken: string
): Promise<{ success: boolean; error?: string }> {
  let expectedPassword: string;
  let expectedToken: string;
  let sessionSecret: string;

  try {
    expectedPassword = requireSecret("SITE_PASSWORD");
    expectedToken = requireSecret("ADMIN_TOKEN");
    sessionSecret = requireSecret("SESSION_SECRET");
  } catch (error) {
    console.error("Admin gate misconfigured:", error);
    return { success: false, error: "Admin access is not configured on this server" };
  }

  const ip = await getClientIp();
  const lockout = await checkLoginLockout("admin", ip);
  if (lockout.locked) {
    return {
      success: false,
      error: `Too many incorrect attempts. Try again in ${lockout.minutesRemaining} minute${lockout.minutesRemaining === 1 ? "" : "s"}.`,
    };
  }

  // Both compared in constant time, and the same message either way: telling
  // the caller which of the two was wrong halves the work of guessing them.
  const passwordOk = constantTimeEqual(sitePassword, expectedPassword);
  const tokenOk = constantTimeEqual(adminToken, expectedToken);
  const isCorrect = passwordOk && tokenOk;
  await recordLoginAttempt("admin", ip, isCorrect);
  if (!isCorrect) {
    return { success: false, error: "Invalid credentials" };
  }

  const expiresAt = adminTokenExpiry();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, await signAdminToken(sessionSecret, expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return { success: true };
}

/** True only for a live, correctly-signed admin session. */
export async function getAdminSessionStatus(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, secret);
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
