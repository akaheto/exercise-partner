import Link from "next/link";
import { Library, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { WorkoutLibrarySearchBar } from "@/components/workout-library/search-bar";
import { listWorkoutProgramsByCategory } from "@/db/queries/workout-programs";

export default async function WorkoutLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";

  const categories = await listWorkoutProgramsByCategory({ search: search || undefined });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Tailored programs"
        description="Choose from pre-built multi-day workout programs. Click a program to view all workouts and add them to your saved list."
        className="mb-8"
      />

      <div className="mb-8">
        <WorkoutLibrarySearchBar initialSearch={search} />
      </div>

      {categories.length === 0 && !search ? (
        <EmptyState
          icon={Library}
          title="No programs imported yet"
          description="Run scripts/import-workout-programs.ts to populate this list."
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No programs match that search"
          description={`Nothing found for "${search}". Try a different name.`}
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
