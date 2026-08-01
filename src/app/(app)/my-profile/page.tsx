import { redirect } from "next/navigation";
import { CurrentProfileCard } from "@/components/profile/current-profile-card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { DeleteProfileSection } from "@/components/profile/delete-profile-section";
import { getActiveProfile } from "@/lib/active-profile";

/**
 * The restricted, single-profile view: everything a person needs to manage
 * their own profile, nothing that touches anyone else's. No "All profiles"
 * switcher, no "Add a profile" form — that's /profile, which is reserved for
 * site administrators (those with SITE_PASSWORD + ADMIN_TOKEN).
 *
 * Admin access is session-based via the site password and admin token, not
 * per-profile. This keeps the authentication model simple: one shared site
 * password (for access control between groups), one admin token (for
 * privileged operations). Profiles themselves have no admin flag.
 */

export default async function MyProfilePage() {
  const profile = await getActiveProfile();

  // No active profile means there's nothing "mine" to show yet. /profile's
  // create-a-profile form is deliberately absent here, so send them to home,
  // which already owns profile selection/creation.
  if (!profile) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-h2 font-semibold text-foreground">My Profile</h1>
        <p className="text-small text-muted-foreground">
          Your own profile — name, weight unit, training level and goal.
        </p>
      </div>

      <CurrentProfileCard profile={profile} />

      <ProfileEditor
        profileId={profile.id}
        currentLevel={profile.experienceLevel}
        currentGoal={profile.trainingGoal}
      />

      <DeleteProfileSection profileId={profile.id} profileName={profile.displayName} />
    </div>
  );
}
