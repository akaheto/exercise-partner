import { listProfiles } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { ProfileSwitcherDialog } from "./profile-switcher-dialog";

/** Server component: fetches profile data, hands it to the interactive dialog. */
export async function ProfileSwitcher() {
  const [profiles, activeProfileId] = await Promise.all([listProfiles(), getActiveProfileId()]);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return <ProfileSwitcherDialog profiles={profiles} activeProfile={activeProfile} />;
}
