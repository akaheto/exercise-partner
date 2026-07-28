import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { DeleteProfileSection } from "@/components/profile/delete-profile-section";
import { listProfiles } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";
import { selectProfile, updatePreferredWeightUnit } from "./actions";
import { CreateProfileForm } from "./create-profile-form";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function ProfilePage() {
  const [profiles, activeProfileId] = await Promise.all([listProfiles(), getActiveProfileId()]);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Everyone shares this site; each profile keeps its own workouts and history separate.
        </p>
      </div>

      {activeProfile ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>{initials(activeProfile.displayName)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{activeProfile.displayName}</span>
              </div>

              <form action={updatePreferredWeightUnit} className="flex items-center gap-3">
                <input type="hidden" name="profileId" value={activeProfile.id} />
                <span className="text-sm text-muted-foreground">Weight unit</span>
                <div className="flex gap-1">
                  {(["kg", "lb"] as const).map((unit) => (
                    <Button
                      key={unit}
                      type="submit"
                      name="unit"
                      value={unit}
                      size="sm"
                      variant={activeProfile.preferredWeightUnit === unit ? "default" : "outline"}
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </form>
            </CardContent>
          </Card>

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
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted disabled:cursor-default disabled:bg-accent disabled:text-accent-foreground"
                      >
                        <Avatar size="sm">
                          <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                        </Avatar>
                        {profile.displayName}
                        {isActive && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
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
