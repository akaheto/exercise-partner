"use client";

import { useState, useTransition, type ReactElement } from "react";
import Image from "next/image";
import { Dumbbell, Search, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchExercisesForPicker, type PickerExercise } from "@/app/(app)/workouts/[id]/edit/actions";

/** Shared search-and-pick UI for both "add exercise" and "substitute" flows.
 * Action-agnostic — the caller decides what selecting an exercise does. */
export function ExercisePickerDialog({
  trigger,
  title,
  description,
  initialResults = [],
  onSelect,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  initialResults?: PickerExercise[];
  onSelect: (exerciseId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerExercise[]>(initialResults);
  const [isSearching, startSearch] = useTransition();
  const [isSelecting, startSelect] = useTransition();

  function onQueryChange(value: string) {
    setQuery(value);
    startSearch(async () => {
      const found = await searchExercisesForPicker(value);
      setResults(found);
    });
  }

  function pick(exerciseId: string) {
    startSelect(async () => {
      await onSelect(exerciseId);
      setOpen(false);
      setQuery("");
      setResults(initialResults);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search exercises…"
            className="pl-9"
            autoFocus
          />
        </div>

        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {results.length === 0 && !isSearching && (
            <li>
              {query ? (
                <EmptyState
                  size="compact"
                  icon={SearchX}
                  title="No exercises match that search"
                  description={`Nothing in the library is named like “${query}”. Try a shorter word, or part of the equipment name.`}
                />
              ) : (
                <EmptyState
                  size="compact"
                  icon={Search}
                  title="Search the library"
                  description="Type an exercise name to see matches from the library."
                />
              )}
            </li>
          )}
          {results.map((r) => (
            <li key={r.exerciseId}>
              <button
                type="button"
                disabled={isSelecting}
                onClick={() => pick(r.exerciseId)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {r.thumbnailUrl ? (
                    <Image src={r.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Dumbbell className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-foreground">{r.name}</p>
                  <p className="truncate text-small text-muted-foreground">
                    {[r.primaryMuscle, r.equipment].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
