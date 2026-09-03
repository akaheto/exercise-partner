import Link from "next/link";
import { ChevronDown, Library, SearchX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { WorkoutLibrarySearchBar } from "@/components/workout-library/search-bar";
import { listWorkoutProgramsByCategory } from "@/db/queries/workout-programs";

const GOAL_OPTIONS = ["Build Muscle", "Lose Fat", "Increase Strength", "General Fitness", "Sports Performance", "Increase Endurance"];
const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const GENDER_OPTIONS = ["Female", "Male", "Male & Female"];
const DURATION_OPTIONS = ["2", "4", "6", "8", "10", "12"];
const DAYS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7"];

export default async function WorkoutLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);
  const filters = {
    goal: str("goal"),
    level: str("level"),
    gender: str("gender"),
    duration: str("duration"),
    days: str("days"),
    search: str("search"),
  };
  const search = filters.search ?? "";

  const categories = await listWorkoutProgramsByCategory(filters);

  // Search box (its own control, always visible) round-trips through its own
  // component's URL construction — badge filters preserve it here alongside
  // whichever other badges are already active.
  const buildFilterUrl = (key: string, value: string | null) => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== key) newParams.set(k, v);
    });
    if (value) newParams.set(key, value);
    const query = newParams.toString();
    return query ? `/build/library?${query}` : "/build/library";
  };

  const activeFilterCount = [filters.goal, filters.level, filters.gender, filters.duration, filters.days].filter(Boolean).length;
  const clearFiltersUrl = search ? `/build/library?search=${encodeURIComponent(search)}` : "/build/library";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Tailored programs"
        description="Choose from pre-built multi-day workout programs. Click a program to view all workouts and add them to your saved list."
        className="mb-8"
      />

      <div className="mb-8 space-y-3">
        <WorkoutLibrarySearchBar initialSearch={search} />

        {/* Collapsed by default — 613 programs makes a permanently-open wall
            of goal/level/gender/duration/days badges scale worse than search
            alone, but the filters themselves are still here on request, just
            tucked away rather than removed. Native <details>, same pattern
            as workout-program-group.tsx: no client JS needed for a toggle
            this simple. */}
        <details className="group rounded-lg border border-border bg-card" open={activeFilterCount > 0}>
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-2 text-small font-medium text-foreground">
            <span className="flex items-center gap-2">
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-caption">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="space-y-4 border-t border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="space-y-2">
                <p className="text-caption font-medium text-muted-foreground">Main Goal</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => (
                    <Link key={goal} href={buildFilterUrl("goal", filters.goal === goal ? null : goal)}>
                      <Badge variant={filters.goal === goal ? "default" : "outline"} className="cursor-pointer">
                        {goal}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-medium text-muted-foreground">Training Level</p>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map((level) => (
                    <Link key={level} href={buildFilterUrl("level", filters.level === level ? null : level)}>
                      <Badge variant={filters.level === level ? "default" : "outline"} className="cursor-pointer">
                        {level}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-medium text-muted-foreground">Target Gender</p>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((gender) => (
                    <Link key={gender} href={buildFilterUrl("gender", filters.gender === gender ? null : gender)}>
                      <Badge variant={filters.gender === gender ? "default" : "outline"} className="cursor-pointer">
                        {gender}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-medium text-muted-foreground">Duration (weeks)</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((dur) => (
                    <Link key={dur} href={buildFilterUrl("duration", filters.duration === dur ? null : dur)}>
                      <Badge variant={filters.duration === dur ? "default" : "outline"} className="cursor-pointer">
                        {dur}w
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-medium text-muted-foreground">Days/Week</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OPTIONS.map((days) => (
                    <Link key={days} href={buildFilterUrl("days", filters.days === days ? null : days)}>
                      <Badge variant={filters.days === days ? "default" : "outline"} className="cursor-pointer">
                        {days}d
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Link href={clearFiltersUrl}>
                <Button variant="ghost" size="sm" className="text-caption">
                  <X className="mr-1 size-3" aria-hidden="true" />
                  Clear filters
                </Button>
              </Link>
            )}
          </div>
        </details>
      </div>

      {categories.length === 0 && !search && activeFilterCount === 0 ? (
        <EmptyState
          icon={Library}
          title="No programs imported yet"
          description="Run scripts/import-workout-programs.ts to populate this list."
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No programs match"
          description={
            search
              ? `Nothing found for "${search}". Try a different word, or clear a filter.`
              : "Nothing matches the selected filters. Try clearing one."
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map(({ category, programs }) => (
            <div key={category}>
              <h2 className="mb-4 text-body-lg font-semibold text-foreground">{category}</h2>
              <div className="flex flex-col gap-3">
                {programs.map((program) => (
                  <Link key={program.programId} href={`/build/library/${program.programId}`}>
                    <Card className="transition-colors hover:border-primary-border">
                      <CardHeader>
                        <CardTitle className="text-body">{program.name}</CardTitle>
                        {program.description && (
                          <CardDescription className="text-caption">{program.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {program.mainGoal && <Badge variant="secondary" className="text-caption">{program.mainGoal}</Badge>}
                        {program.trainingLevel && <Badge variant="outline" className="text-caption">{program.trainingLevel}</Badge>}
                        {/* `0 && (...)` renders a literal "0" in React, not
                            nothing — a real 0-week/0-day value (14 programs
                            have durationWeeks: 0) needs an explicit check,
                            not a truthiness shortcut. */}
                        {program.daysPerWeek !== null && program.daysPerWeek > 0 && (
                          <Badge variant="outline" className="text-caption">{program.daysPerWeek} days/week</Badge>
                        )}
                        {program.durationWeeks !== null && program.durationWeeks > 0 && (
                          <Badge variant="outline" className="text-caption">{program.durationWeeks} weeks</Badge>
                        )}
                        {program.targetGender && <Badge variant="outline" className="text-caption">{program.targetGender}</Badge>}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
