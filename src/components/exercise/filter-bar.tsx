"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Search, Table as TableIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BODY_REGION_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FORCE_OPTIONS,
  MECHANICS_OPTIONS,
  SORT_OPTIONS,
  buildExerciseFiltersQuery,
  hasActiveFilters,
  type ExerciseFilters,
  type SortOption,
} from "@/domain/exercise-filters";

const SORT_LABELS: Record<SortOption, string> = {
  "name-asc": "Name (A–Z)",
  "name-desc": "Name (Z–A)",
  muscle: "Primary muscle",
  equipment: "Equipment",
  level: "Experience level",
};

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus-ring h-11 rounded-lg border border-input bg-background px-3 text-small text-foreground outline-none"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({
  filters,
  muscleOptions,
  equipmentOptions,
}: {
  filters: ExerciseFilters;
  muscleOptions: string[];
  equipmentOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjust local state during render when filters.q changes externally (back/
  // forward navigation, Clear filters) — React's documented pattern for this,
  // rather than an effect: https://react.dev/learn/you-might-not-need-an-effect
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    setSearchValue(filters.q);
  }

  function go(changes: Partial<ExerciseFilters>) {
    router.push(pathname + buildExerciseFiltersQuery(filters, changes));
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => go({ q: value }), 300);
  }

  return (
    <div className="space-y-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search exercises by name…"
            className="pl-9"
            aria-label="Search exercises"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => go({ sort: e.target.value as SortOption })}
            className="focus-ring h-11 rounded-lg border border-input bg-background px-3 text-small text-foreground outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                Sort: {SORT_LABELS[opt]}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-input">
            <Button
              type="button"
              variant={filters.view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none border-0"
              aria-label="Card view"
              aria-pressed={filters.view === "card"}
              onClick={() => go({ view: "card" })}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={filters.view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none border-0"
              aria-label="Table view"
              aria-pressed={filters.view === "table"}
              onClick={() => go({ view: "table" })}
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select label="Muscle" value={filters.muscle ?? ""} options={muscleOptions} onChange={(v) => go({ muscle: v || null })} />
        <Select
          label="Equipment"
          value={filters.equipment ?? ""}
          options={equipmentOptions}
          onChange={(v) => go({ equipment: v || null })}
        />
        <Select label="Type" value={filters.type ?? ""} options={EXERCISE_TYPE_OPTIONS} onChange={(v) => go({ type: v || null })} />
        <Select
          label="Mechanics"
          value={filters.mechanics ?? ""}
          options={MECHANICS_OPTIONS}
          onChange={(v) => go({ mechanics: v || null })}
        />
        <Select label="Force" value={filters.force ?? ""} options={FORCE_OPTIONS} onChange={(v) => go({ force: v || null })} />
        <Select
          label="Experience level"
          value={filters.level ?? ""}
          options={EXPERIENCE_LEVEL_OPTIONS}
          onChange={(v) => go({ level: v || null })}
        />
        <Select label="Body region" value={filters.region ?? ""} options={BODY_REGION_OPTIONS} onChange={(v) => go({ region: v || null })} />

        <label className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-small text-foreground">
          <input
            type="checkbox"
            checked={filters.videoOnly}
            onChange={(e) => go({ videoOnly: e.target.checked })}
            className="size-4 accent-primary"
          />
          Has video
        </label>

        {hasActiveFilters(filters) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push(pathname)} className="gap-1">
            <X className="size-4" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
