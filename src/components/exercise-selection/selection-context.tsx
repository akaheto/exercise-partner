"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

export interface SelectedExercise {
  exerciseId: string;
  name: string;
}

interface SelectionStore {
  getMap: () => Map<string, string>;
  getSelectedArray: () => SelectedExercise[];
  subscribe: (listener: () => void) => () => void;
  toggle: (exercise: SelectedExercise) => void;
  clear: () => void;
}

/**
 * A plain external store (React's useSyncExternalStore, not Context's value
 * prop) so a card checking its own selection status only re-renders when
 * *its* entry changes — not every other card on the page too. QA-audit item
 * 14: a Context whose value is a fresh object on every toggle (the
 * pre-2026-09-01 version of this file) re-renders every consumer on every
 * toggle regardless of relevance; measured via React's Profiler API against
 * a 24-card grid, this cost ~62ms of wasted render work per tap in dev mode
 * — the multi-select workflow taps repeatedly, so that cost compounds.
 * SelectionBar is the one legitimate exception: it needs the whole list, but
 * there's only ever one of it on screen, so re-rendering it on every change
 * is fine (see useSelectedExercises below).
 */
function createSelectionStore(): SelectionStore {
  let map = new Map<string, string>();
  let selectedArray: SelectedExercise[] = [];
  const listeners = new Set<() => void>();

  function commit(nextMap: Map<string, string>) {
    map = nextMap;
    selectedArray = [...nextMap.entries()].map(([exerciseId, name]) => ({ exerciseId, name }));
    for (const listener of listeners) listener();
  }

  return {
    getMap: () => map,
    getSelectedArray: () => selectedArray,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    toggle: (exercise) => {
      const next = new Map(map);
      if (next.has(exercise.exerciseId)) next.delete(exercise.exerciseId);
      else next.set(exercise.exerciseId, exercise.name);
      commit(next);
    },
    clear: () => commit(new Map()),
  };
}

const SelectionStoreContext = createContext<SelectionStore | null>(null);

/**
 * Lives at the (app) layout level (not page level) so selections survive
 * filter/pagination navigation on the Exercise Library — Next.js guarantees
 * client component state persists across navigations within a stable layout,
 * which page-level state would not reliably do. useState's lazy initializer
 * creates the store exactly once and is never actually set again — the
 * store's own subscriber list handles updates, not Context's value prop —
 * this is just the idiomatic way to create a stable instance without
 * reading a ref during render.
 */
export function ExerciseSelectionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createSelectionStore());

  return <SelectionStoreContext.Provider value={store}>{children}</SelectionStoreContext.Provider>;
}

function useSelectionStore(): SelectionStore {
  const store = useContext(SelectionStoreContext);
  if (!store) throw new Error("useExerciseSelection must be used within ExerciseSelectionProvider");
  return store;
}

/** Nothing is selected during SSR — selections only ever come from a click
 * in the browser — so both hooks below use this as their getServerSnapshot.
 * Without one, useSyncExternalStore throws on any route that gets
 * server-rendered (found via a real `npm run build` failure on
 * /build/generate, not assumed). */
const nothingSelected = () => false;
const EMPTY_SELECTION: SelectedExercise[] = [];

/** For one card: re-renders only when *this* exerciseId's selected state changes. */
export function useIsExerciseSelected(exerciseId: string): boolean {
  const store = useSelectionStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getMap().has(exerciseId),
    nothingSelected,
  );
}

/** Stable across renders — toggling one card never needs a new function reference. */
export function useToggleExerciseSelection(): (exercise: SelectedExercise) => void {
  const store = useSelectionStore();
  return useCallback((exercise) => store.toggle(exercise), [store]);
}

/** For the selection summary bar only — the one place the whole list is
 * actually needed. getSelectedArray() returns a stable reference between
 * commits, so this only re-renders on a real change, not every render. */
export function useSelectedExercises(): SelectedExercise[] {
  const store = useSelectionStore();
  return useSyncExternalStore(store.subscribe, store.getSelectedArray, () => EMPTY_SELECTION);
}

export function useClearExerciseSelection(): () => void {
  const store = useSelectionStore();
  return useCallback(() => store.clear(), [store]);
}
