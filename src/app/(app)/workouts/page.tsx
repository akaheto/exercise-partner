import { Suspense } from "react";
import Link from "next/link";
import { Archive, ListChecks, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { WorkoutCard } from "@/components/workout-library/workout-card";
import { WorkoutProgramGroup } from "@/components/workout-library/workout-program-group";
import { WorkoutSearchBar } from "@/components/workout-library/workout-search-bar";
import { listWorkoutSummaries } from "@/db/queries/workouts";
import { getActiveProfileId } from "@/lib/active-profile";
import { batchWorkoutDisplayRows, groupWorkoutSummaries } from "@/domain/workout-list-grouping";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const profileId = await getActiveProfileId();
  const q = typeof params.q === "string" ? params.q : "";
  const showArchived = params.archived === "1";
  const added = typeof params.added === "string" ? Number(params.added) : null;
  const skipped = typeof params.skipped === "string" ? params.skipped : null;

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

      {added !== null && added > 0 && (
        <Callout tone="success" title={`Added ${added} workout${added === 1 ? "" : "s"}`} className="mb-4">
          <p>From the Workout Library, one per training day.</p>
        </Callout>
      )}
      {skipped && (
        <Callout tone="warning" title="Some exercises weren't included" className="mb-4">
          <p>
            Not yet in the exercise library, so they were left out: {skipped}.
          </p>
        </Callout>
      )}

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
        <div className="flex flex-col gap-4">
          {/* Groups (Epic Q5) get their own full-width, collapsed-by-default
              section; runs of ungrouped workouts between them keep the
              original dense grid rather than dropping to one per row. */}
          {batchWorkoutDisplayRows(groupWorkoutSummaries(workouts)).map((row) =>
            row.kind === "group" ? (
              <WorkoutProgramGroup
                key={row.group.sourceProgramId}
                sourceProgramName={row.group.sourceProgramName}
                workouts={row.group.workouts}
                archived={showArchived}
              />
            ) : (
              <div key={row.workouts[0].id} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {row.workouts.map((w) => (
                  <WorkoutCard key={w.id} workout={w} archived={showArchived} />
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
