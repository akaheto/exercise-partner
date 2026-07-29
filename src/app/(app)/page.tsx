import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { ProfileSelector } from "@/components/home/profile-selector";
import { listProfiles } from "@/db/queries/profiles";
import { getActiveProfile } from "@/lib/active-profile";

export default async function HomePage() {
  const [profiles, activeProfile] = await Promise.all([listProfiles(), getActiveProfile()]);

  // An active profile that hasn't finished onboarding goes back to it rather
  // than to /exercises — same fix as /onboarding's own guard, applied here
  // since a second tab opened mid-flow hit this exact redirect otherwise.
  if (activeProfile) {
    redirect(activeProfile.onboardingCompletedAt ? "/exercises" : "/onboarding");
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <span
            className="flex size-14 items-center justify-center rounded-full bg-primary-subtle"
            aria-hidden="true"
          >
            <Dumbbell className="size-8 text-primary-text" />
          </span>
          <h1 className="text-display text-foreground">Exercise Partner</h1>
          <p className="max-w-lg text-body-lg text-muted-foreground">
            Workout guidance tuned to your experience level and training goal.
          </p>
        </div>

        {/* Profile Selector */}
        <ProfileSelector profiles={profiles} />

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-caption text-muted-foreground">
            Everyone shares this site. Each profile keeps its workouts and history separate.
          </p>
        </div>
      </div>
    </div>
  );
}
