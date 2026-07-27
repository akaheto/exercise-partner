import { Suspense } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
      <h1 className="mb-4 text-xl font-semibold text-foreground">Workouts</h1>

      <Suspense>
        <WorkoutSearchBar showArchived={showArchived} />
      </Suspense>

      {!profileId ? (
        <p className="text-sm text-muted-foreground">Choose a profile to see its workouts.</p>
      ) : workouts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <ListChecks className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">
            {q || showArchived ? "No workouts match that." : "No workouts yet"}
          </h2>
          {!q && !showArchived && (
            <>
              <p className="max-w-sm text-sm text-muted-foreground">
                Build one by hand, generate one, or select exercises from the library.
              </p>
              <Link href="/build" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
                Build a workout
              </Link>
            </>
          )}
        </div>
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
