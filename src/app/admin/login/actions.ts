"use server";

import { cookies } from "next/headers";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "change-me";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me-in-production";
const ADMIN_SESSION_COOKIE = "admin_session";

export async function validateAdminAccess(
  sitePassword: string,
  adminToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify site password
    if (sitePassword !== SITE_PASSWORD) {
      return { success: false, error: "Invalid site password" };
    }

    // Verify admin token
    if (adminToken !== ADMIN_TOKEN) {
      return { success: false, error: "Invalid admin token" };
    }

    // Both valid - set admin session cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/admin",
    });

    return { success: true };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function getAdminSessionStatus(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE);
    return session?.value === "authenticated";
  } catch {
    return false;
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
