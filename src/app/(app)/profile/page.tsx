import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentProfileCard } from "@/components/profile/current-profile-card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { DeleteProfileSection } from "@/components/profile/delete-profile-section";
import { listProfiles } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { getAdminSessionStatus } from "@/app/admin/login/actions";
import { initials } from "@/lib/utils";
import { selectProfile } from "./actions";
import { CreateProfileForm } from "./create-profile-form";

export default async function ProfilePage() {
  const isAdmin = await getAdminSessionStatus();
  if (!isAdmin) {
    redirect("/my-profile");
  }

  const [profiles, activeProfileId] = await Promise.all([listProfiles(), getActiveProfileId()]);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-h2 font-semibold text-foreground">Profile</h1>
        <p className="text-small text-muted-foreground">
          Everyone shares this site; each profile keeps its own workouts and history separate.
        </p>
      </div>

      {activeProfile ? (
        <>
          <CurrentProfileCard profile={activeProfile} />

          <ProfileEditor
            profileId={activeProfile.id}
            currentLevel={activeProfile.experienceLevel}
            currentGoal={activeProfile.trainingGoal}
          />

          <DeleteProfileSection profileId={activeProfile.id} profileName={activeProfile.displayName} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" aria-hidden="true" /> No profile selected
            </CardTitle>
            <CardDescription>Choose one below, or add a new one.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfile?.id;
                return (
                  <li key={profile.id}>
                    <form action={selectProfile}>
                      <input type="hidden" name="profileId" value={profile.id} />
                      <button
                        type="submit"
                        disabled={isActive}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-small font-medium transition-colors hover:bg-muted disabled:cursor-default disabled:bg-accent disabled:text-accent-foreground"
                      >
                        <Avatar size="sm">
                          <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                        </Avatar>
                        {profile.displayName}
                        {isActive && <span className="ml-auto text-caption text-muted-foreground">Current</span>}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a profile</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
