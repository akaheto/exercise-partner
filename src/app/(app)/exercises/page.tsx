import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { ExerciseCard } from "@/components/exercise/exercise-card";
import { ExerciseTable } from "@/components/exercise/exercise-table";
import { FilterBar } from "@/components/exercise/filter-bar";
import { Pagination } from "@/components/exercise/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listEquipmentOptions, listExercises, listMuscleOptions } from "@/db/queries/exercises";
import { describeActiveFilters, parseExerciseFilters } from "@/domain/exercise-filters";
import { cn } from "@/lib/utils";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseExerciseFilters(await searchParams);

  const [{ rows, total, pageCount }, muscleOptions, equipmentOptions] = await Promise.all([
    listExercises(filters),
    listMuscleOptions(),
    listEquipmentOptions(),
  ]);

  const activeFilters = describeActiveFilters(filters);

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-6 pb-4 md:px-6">
        <PageHeader
          title="Exercise library"
          description="Search and filter the full library, then open an exercise for instructions, muscles worked and substitutions."
        />
      </div>

      <FilterBar
        filters={filters}
        muscleOptions={muscleOptions.map((m) => m.name)}
        equipmentOptions={equipmentOptions.map((e) => e.name)}
      />

      <div className="px-4 py-4 md:px-6">
        <p className="mb-4 text-small text-muted-foreground">
          {total.toLocaleString()} exercise{total === 1 ? "" : "s"}
        </p>

        {rows.length === 0 ? (
          activeFilters.length > 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No exercises match these filters"
              description={`Nothing in the library matches ${activeFilters.join(", ")}. Remove one of those, or search for something else.`}
              action={
                <Link href="/exercises" className={cn(buttonVariants({ variant: "outline" }))}>
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="Nothing on this page"
              description="There are no exercises to show here. Go back to the first page of the library."
              action={
                <Link href="/exercises" className={cn(buttonVariants({ variant: "outline" }))}>
                  Back to the library
                </Link>
              }
            />
          )
        ) : filters.view === "table" ? (
          <ExerciseTable exercises={rows} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((exercise) => (
              <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
            ))}
          </div>
        )}

        <Pagination filters={filters} pageCount={pageCount} />
      </div>
    </div>
  );
}
