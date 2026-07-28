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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-900/30">
              <Dumbbell className="size-8 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Exercise Partner</h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Personalized workout guidance tailored to your experience level and training goals.
          </p>
        </div>

        {/* Profile Selector */}
        <ProfileSelector profiles={profiles} />

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Everyone shares this site. Each profile keeps its workouts and history separate.
          </p>
        </div>
      </div>
    </div>
  );
}
