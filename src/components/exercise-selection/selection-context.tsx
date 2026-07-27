"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SelectedExercise {
  exerciseId: string;
  name: string;
}

interface SelectionContextValue {
  selected: SelectedExercise[];
  isSelected: (exerciseId: string) => boolean;
  toggle: (exercise: SelectedExercise) => void;
  clear: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

/**
 * Lives at the (app) layout level (not page level) so selections survive
 * filter/pagination navigation on the Exercise Library — Next.js guarantees
 * client component state persists across navigations within a stable layout,
 * which page-level state would not reliably do.
 */
export function ExerciseSelectionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, string>>(new Map());

  const toggle = useCallback((exercise: SelectedExercise) => {
    setMap((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.exerciseId)) next.delete(exercise.exerciseId);
      else next.set(exercise.exerciseId, exercise.name);
      return next;
    });
  }, []);

  const clear = useCallback(() => setMap(new Map()), []);
  const isSelected = useCallback((exerciseId: string) => map.has(exerciseId), [map]);
  const selected = useMemo(() => [...map.entries()].map(([exerciseId, name]) => ({ exerciseId, name })), [map]);

  const value = useMemo(() => ({ selected, isSelected, toggle, clear }), [selected, isSelected, toggle, clear]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useExerciseSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useExerciseSelection must be used within ExerciseSelectionProvider");
  return ctx;
}
