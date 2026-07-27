import { cookies } from "next/headers";
import { getProfileById } from "@/db/queries/profiles";

export const ACTIVE_PROFILE_COOKIE = "active_profile_id";

export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;
}

/** Resolves the active profile, or null if none is set or it no longer exists. */
export async function getActiveProfile() {
  const id = await getActiveProfileId();
  if (!id) return null;
  return getProfileById(id);
}
