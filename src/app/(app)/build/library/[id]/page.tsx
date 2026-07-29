import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { addWorkoutProgramToWorkouts } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkoutProgramWithDays } from "@/db/queries/workout-programs";

export default async function WorkoutLibraryProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkoutProgramWithDays(id);
  if (!result) notFound();

  const { program, days } = result;
  const trainingDays = days.filter((d) => !d.isRestDay);
  const addProgram = addWorkoutProgramToWorkouts.bind(null, program.programId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/build/library"
        className="mb-4 inline-flex items-center gap-1 text-small text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Workout library
      </Link>

      <PageHeader
        title={program.name}
        description={program.description ?? undefined}
        className="mb-4"
        actions={
          <form action={addProgram}>
            <Button type="submit">
              <Plus className="size-4" aria-hidden="true" />
              Add to my workouts
            </Button>
          </form>
        }
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {program.mainGoal && <Badge variant="secondary">{program.mainGoal}</Badge>}
        {program.workoutType && <Badge variant="outline">{program.workoutType}</Badge>}
        {program.trainingLevel && <Badge variant="outline">{program.trainingLevel}</Badge>}
        {program.daysPerWeek && <Badge variant="outline">{program.daysPerWeek} days/week</Badge>}
        {program.durationWeeks && <Badge variant="outline">{program.durationWeeks} weeks</Badge>}
        {program.timePerWorkout && <Badge variant="outline">{program.timePerWorkout}</Badge>}
        {program.targetGender && <Badge variant="outline">{program.targetGender}</Badge>}
      </div>

      {program.equipmentNeeded && (
        <p className="mb-8 text-small text-muted-foreground">
          <span className="font-medium text-foreground">Equipment: </span>
          {program.equipmentNeeded}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {trainingDays.map((day) => (
          <Card key={day.id}>
            <CardHeader>
              <CardTitle>
                Day {day.dayNumber}
                {day.focus ? ` — ${day.focus}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable minWidth={480}>
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeader>Exercise</DataTableHeader>
                    <DataTableHeader align="center">Sets</DataTableHeader>
                    <DataTableHeader align="center">Reps</DataTableHeader>
                    <DataTableHeader align="center">Rest</DataTableHeader>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {day.exercises.map((ex) => (
                    <DataTableRow key={ex.id}>
                      <DataTableCell className="text-foreground">
                        {ex.exerciseId ? (
                          <Link href={`/exercises/${ex.exerciseId}`} className="hover:underline">
                            {ex.exerciseName ?? ex.exerciseNameRaw}
                          </Link>
                        ) : (
                          <span title="Not linked to an exercise in the library">
                            {ex.exerciseNameRaw}
                          </span>
                        )}
                        {ex.notes && (
                          <span className="block text-caption text-muted-foreground">
                            {ex.notes}
                          </span>
                        )}
                      </DataTableCell>
                      <DataTableCell align="center" numeric>
                        {ex.sets ?? "—"}
                      </DataTableCell>
                      <DataTableCell align="center" numeric>
                        {ex.reps ?? "—"}
                      </DataTableCell>
                      <DataTableCell align="center" numeric>
                        {ex.rest ?? "—"}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
