import Link from "next/link";
import { Library, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listWorkoutProgramsByCategory } from "@/db/queries/workout-programs";

const GOAL_OPTIONS = ["Build Muscle", "Lose Fat", "Increase Strength", "General Fitness"];
const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const GENDER_OPTIONS = ["Female", "Male", "Male & Female"];
const DURATION_OPTIONS = ["2", "4", "6", "8", "10", "12"];
const DAYS_OPTIONS = ["2", "3", "4", "5", "6", "7"];

export default async function WorkoutLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    goal: typeof params.goal === "string" ? params.goal : undefined,
    level: typeof params.level === "string" ? params.level : undefined,
    gender: typeof params.gender === "string" ? params.gender : undefined,
    duration: typeof params.duration === "string" ? params.duration : undefined,
    days: typeof params.days === "string" ? params.days : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
  };

  const categories = await listWorkoutProgramsByCategory(filters);

  const buildFilterUrl = (key: string, value: string | null) => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== key) newParams.set(k, v);
    });
    if (value) newParams.set(key, value);
    const query = newParams.toString();
    return query ? `/build/library?${query}` : "/build/library";
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Tailored programs"
        description="Choose from pre-built multi-day workout programs. Click a program to view all workouts and add them to your saved list."
        className="mb-8"
      />

      <div className="mb-8 space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Goal filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Main Goal</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <Link key={goal} href={buildFilterUrl("goal", filters.goal === goal ? null : goal)}>
                  <Badge
                    variant={filters.goal === goal ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {goal}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Training Level</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((level) => (
                <Link key={level} href={buildFilterUrl("level", filters.level === level ? null : level)}>
                  <Badge
                    variant={filters.level === level ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {level}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Gender filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Target Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((gender) => (
                <Link key={gender} href={buildFilterUrl("gender", filters.gender === gender ? null : gender)}>
                  <Badge
                    variant={filters.gender === gender ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {gender}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Duration filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Duration (weeks)</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((dur) => (
                <Link key={dur} href={buildFilterUrl("duration", filters.duration === dur ? null : dur)}>
                  <Badge
                    variant={filters.duration === dur ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {dur}w
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Days per week filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Days/Week</p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map((days) => (
                <Link key={days} href={buildFilterUrl("days", filters.days === days ? null : days)}>
                  <Badge
                    variant={filters.days === days ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {days}d
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <Link href="/build/library">
            <Button variant="ghost" size="sm" className="text-xs">
              <X className="mr-1 size-3" />
              Clear filters
            </Button>
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No programs imported yet"
          description="Run scripts/import-workout-programs.ts to populate this list."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map(({ category, programs }) => (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{category}</h2>
              <div className="flex flex-col gap-3">
                {programs.map((program) => (
                  <Link key={program.programId} href={`/build/library/${program.programId}`}>
                    <Card className="transition-colors hover:border-primary-border">
                      <CardHeader>
                        <CardTitle className="text-base">{program.name}</CardTitle>
                        {program.description && (
                          <CardDescription className="text-xs">{program.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {program.mainGoal && <Badge variant="secondary" className="text-xs">{program.mainGoal}</Badge>}
                        {program.trainingLevel && <Badge variant="outline" className="text-xs">{program.trainingLevel}</Badge>}
                        {program.daysPerWeek && (
                          <Badge variant="outline" className="text-xs">{program.daysPerWeek} days/week</Badge>
                        )}
                        {program.durationWeeks && (
                          <Badge variant="outline" className="text-xs">{program.durationWeeks} weeks</Badge>
                        )}
                        {program.targetGender && <Badge variant="outline" className="text-xs">{program.targetGender}</Badge>}
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
