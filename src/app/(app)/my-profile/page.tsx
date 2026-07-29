import { redirect } from "next/navigation";
import { CurrentProfileCard } from "@/components/profile/current-profile-card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { DeleteProfileSection } from "@/components/profile/delete-profile-section";
import { getActiveProfile } from "@/lib/active-profile";

/**
 * The restricted, single-profile view: everything a person needs to manage
 * their own profile, nothing that touches anyone else's. No "All profiles"
 * switcher, no "Add a profile" form — that's /profile, which this is meant
 * to eventually replace for non-administrator users (see PROJECT_PLAN.docx).
 * There is no admin flag on a profile today; gating /profile to admins only
 * is a separate, not-yet-made decision — for now both routes coexist.
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
