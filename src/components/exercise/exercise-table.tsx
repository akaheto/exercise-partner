"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import type { SourceExerciseRow } from "./types";

/**
 * Table view of the library.
 *
 * The whole row is the click target, not just the name cell — a 720px-wide row
 * where only ~120px of it navigates is a target-size trap, and every other
 * cell in the row is about the same exercise anyway. The real <a> stays in the
 * name cell so keyboard users get a focusable link, screen readers get a link
 * with an accessible name, and middle-click / open-in-new-tab still work; the
 * row handler is a pointer convenience layered on top of it, which is why the
 * anchor stops propagation rather than letting the row navigate twice.
 */
export function ExerciseTable({ exercises }: { exercises: SourceExerciseRow[] }) {
  const router = useRouter();

  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeader>Name</DataTableHeader>
          <DataTableHeader>Primary muscle</DataTableHeader>
          <DataTableHeader>Equipment</DataTableHeader>
          <DataTableHeader>Type</DataTableHeader>
          <DataTableHeader>Level</DataTableHeader>
          <DataTableHeader align="center">Video</DataTableHeader>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {exercises.map((exercise) => {
          const href = `/exercises/${exercise.exerciseId}`;
          return (
            <DataTableRow
              key={exercise.exerciseId}
              interactive
              className="cursor-pointer"
              onClick={() => router.push(href)}
            >
              <DataTableCell className="font-medium text-foreground">
                <Link
                  href={href}
                  className="focus-ring hover:text-primary-text hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {exercise.name}
                </Link>
              </DataTableCell>
              <DataTableCell>{exercise.primaryMuscle}</DataTableCell>
              <DataTableCell>{exercise.equipment}</DataTableCell>
              <DataTableCell>{exercise.exerciseType}</DataTableCell>
              <DataTableCell>{exercise.experienceLevel}</DataTableCell>
              <DataTableCell align="center">
                {exercise.videoAvailable && (
                  <Video className="mx-auto size-4 text-primary" aria-label="Video available" />
                )}
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
