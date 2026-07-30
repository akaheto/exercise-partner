import Link from "next/link";
import { Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listWorkoutProgramsByCategory } from "@/db/queries/workout-programs";

export default async function WorkoutLibraryPage() {
  const categories = await listWorkoutProgramsByCategory();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <PageHeader
        title="Tailored programs"
        description="Choose from pre-built multi-day workout programs. Click a program to view all workouts and add them to your saved list."
        className="mb-8"
      />

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
