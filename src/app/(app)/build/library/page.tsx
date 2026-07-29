import Link from "next/link";
import { Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listWorkoutPrograms } from "@/db/queries/workout-programs";

/**
 * Epic Q, evaluation slice: a plain list of whatever programs
 * scripts/import-workout-programs.ts has imported so far — 4, as of this
 * commit. No facet filtering yet (goal/duration/equipment/audience, per
 * PROJECT_PLAN.docx) — that comes once there's enough imported content for
 * filtering to mean anything. No "Add to my workouts" yet either; this page
 * exists to make the imported data reviewable before either is built.
 */
export default async function WorkoutLibraryPage() {
  const programs = await listWorkoutPrograms();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Workout library"
        description="Packaged multi-day programs, imported for review. Not yet addable to your saved workouts."
        className="mb-8"
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No programs imported yet"
          description="Run scripts/import-workout-programs.ts to populate this list."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {programs.map((program) => (
            <Link key={program.programId} href={`/build/library/${program.programId}`}>
              <Card className="transition-colors hover:border-primary-border">
                <CardHeader>
                  <CardTitle>{program.name}</CardTitle>
                  {program.description && (
                    <CardDescription>{program.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {program.mainGoal && <Badge variant="secondary">{program.mainGoal}</Badge>}
                  {program.trainingLevel && <Badge variant="outline">{program.trainingLevel}</Badge>}
                  {program.daysPerWeek && (
                    <Badge variant="outline">{program.daysPerWeek} days/week</Badge>
                  )}
                  {program.durationWeeks && (
                    <Badge variant="outline">{program.durationWeeks} weeks</Badge>
                  )}
                  {program.targetGender && <Badge variant="outline">{program.targetGender}</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
