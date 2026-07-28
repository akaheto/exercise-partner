import { cookies } from "next/headers";
import { getProfileById } from "@/db/queries/profiles";

export const ACTIVE_PROFILE_COOKIE = "active_profile_id";

/** The active profile's id, or null if none is set or the cookie points at a
 * profile that no longer exists. Callers branch on this to decide whether a
 * profile is usable, so an unvalidated id makes the app believe a deleted
 * profile is active: /onboarding redirects away, /profile renders "no profile
 * selected", and every profile-scoped query returns empty. */
export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (!id) return null;
  return (await getProfileById(id)) ? id : null;
}

/** Resolves the active profile, or null if none is set or it no longer exists. */
export async function getActiveProfile() {
  const cookieStore = await cookies();
  const id = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (!id) return null;
  return getProfileById(id);
}
