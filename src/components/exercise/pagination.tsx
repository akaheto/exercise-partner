import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildExerciseFiltersQuery, type ExerciseFilters } from "@/domain/exercise-filters";

export function Pagination({ filters, pageCount }: { filters: ExerciseFilters; pageCount: number }) {
  if (pageCount <= 1) return null;

  const prevDisabled = filters.page <= 1;
  const nextDisabled = filters.page >= pageCount;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 py-6">
      <Link
        href={buildExerciseFiltersQuery(filters, { page: filters.page - 1 }) || "?"}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          prevDisabled && "pointer-events-none opacity-50",
        )}
      >
        Previous
      </Link>
      <span className="text-small text-muted-foreground">
        Page {filters.page} of {pageCount}
      </span>
      <Link
        href={buildExerciseFiltersQuery(filters, { page: filters.page + 1 })}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          nextDisabled && "pointer-events-none opacity-50",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
