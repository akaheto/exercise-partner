import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { ProfileSelector } from "@/components/home/profile-selector";
import { listProfiles } from "@/db/queries/profiles";
import { getActiveProfileId } from "@/lib/active-profile";

export default async function HomePage() {
  const [profiles, activeProfileId] = await Promise.all([listProfiles(), getActiveProfileId()]);

  // If user has an active profile, go to exercises
  if (activeProfileId) {
    redirect("/exercises");
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
