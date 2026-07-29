import { Suspense } from "react";
import Link from "next/link";
import { Archive, ListChecks, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { WorkoutCard } from "@/components/workout-library/workout-card";
import { WorkoutSearchBar } from "@/components/workout-library/workout-search-bar";
import { listWorkoutSummaries } from "@/db/queries/workouts";
import { getActiveProfileId } from "@/lib/active-profile";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const profileId = await getActiveProfileId();
  const q = typeof params.q === "string" ? params.q : "";
  const showArchived = params.archived === "1";

  const workouts = profileId
    ? await listWorkoutSummaries(profileId, { search: q, includeArchived: showArchived })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <PageHeader
        title="Workouts"
        description="Everything you've saved. Open one to edit it, or start it from here."
        className="mb-4"
      />

      <Suspense>
        <WorkoutSearchBar showArchived={showArchived} />
      </Suspense>

      {!profileId ? (
        <EmptyState
          icon={UserRound}
          title="No profile selected"
          description="Workouts belong to a profile. Choose one and its workouts show up here."
          action={
            <Link href="/profile" className={cn(buttonVariants({ variant: "default" }))}>
              Choose a profile
            </Link>
          }
        />
      ) : workouts.length === 0 ? (
        q ? (
          <EmptyState
            icon={ListChecks}
            title="No workouts match that search"
            description={`Nothing ${showArchived ? "in the archive" : "in your workouts"} matches “${q}”. Try a shorter word, or clear the search.`}
            action={
              <Link
                href={showArchived ? "/workouts?archived=1" : "/workouts"}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Clear search
              </Link>
            }
          />
        ) : showArchived ? (
          <EmptyState
            icon={Archive}
            title="Nothing archived"
            description="Workouts you archive land here. You haven't archived any yet."
            action={
              <Link href="/workouts" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to your workouts
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No workouts yet"
            description="Build one by hand, generate one, or select exercises from the library."
            action={
              <Link href="/build" className={cn(buttonVariants({ variant: "default" }))}>
                Build a workout
              </Link>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} archived={showArchived} />
          ))}
        </div>
      )}
    </div>
  );
}
