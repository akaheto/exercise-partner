import { Dumbbell } from "lucide-react";
import { ExerciseCard } from "@/components/exercise/exercise-card";
import { ExerciseTable } from "@/components/exercise/exercise-table";
import { FilterBar } from "@/components/exercise/filter-bar";
import { Pagination } from "@/components/exercise/pagination";
import { listEquipmentOptions, listExercises, listMuscleOptions } from "@/db/queries/exercises";
import { parseExerciseFilters } from "@/domain/exercise-filters";

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

  return (
    <div className="flex flex-col">
      <FilterBar
        filters={filters}
        muscleOptions={muscleOptions.map((m) => m.name)}
        equipmentOptions={equipmentOptions.map((e) => e.name)}
      />

      <div className="px-4 py-4 md:px-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {total.toLocaleString()} exercise{total === 1 ? "" : "s"}
        </p>

        {rows.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <Dumbbell className="size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">No exercises match those filters</h2>
            <p className="max-w-sm text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
          </div>
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
