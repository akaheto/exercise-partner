/**
 * Pure parsing/serialisation for the Exercise Library's URL-driven filter
 * state (Epic D1/D2 — "sort/filter/view state is shareable via URL"). No I/O,
 * no Next.js types, so it's directly unit-testable.
 */

export const SORT_OPTIONS = ["name-asc", "name-desc", "muscle", "equipment", "level"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const VIEW_OPTIONS = ["card", "table"] as const;
export type ViewOption = (typeof VIEW_OPTIONS)[number];

export const PAGE_SIZE = 24;

export interface ExerciseFilters {
  q: string;
  muscle: string | null;
  equipment: string | null;
  type: string | null;
  mechanics: string | null;
  force: string | null;
  level: string | null;
  region: string | null;
  videoOnly: boolean;
  sort: SortOption;
  view: ViewOption;
  page: number;
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parses Next.js's searchParams shape into typed, defaulted filter state. */
export function parseExerciseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ExerciseFilters {
  const sortRaw = firstString(searchParams.sort);
  const viewRaw = firstString(searchParams.view);
  const pageRaw = firstString(searchParams.page);
  const pageNum = pageRaw ? Number.parseInt(pageRaw, 10) : 1;

  return {
    q: firstString(searchParams.q)?.trim() ?? "",
    muscle: firstString(searchParams.muscle) || null,
    equipment: firstString(searchParams.equipment) || null,
    type: firstString(searchParams.type) || null,
    mechanics: firstString(searchParams.mechanics) || null,
    force: firstString(searchParams.force) || null,
    level: firstString(searchParams.level) || null,
    region: firstString(searchParams.region) || null,
    videoOnly: firstString(searchParams.video) === "yes",
    sort: (SORT_OPTIONS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as SortOption) : "name-asc",
    view: (VIEW_OPTIONS as readonly string[]).includes(viewRaw ?? "") ? (viewRaw as ViewOption) : "card",
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
  };
}

/**
 * Builds a query string for a set of filters, merged over the current ones.
 * Changing a filter other than `page` resets pagination to page 1, since the
 * result set has changed. Falsy/default values are omitted so URLs stay
 * clean and shareable.
 */
export function buildExerciseFiltersQuery(
  current: ExerciseFilters,
  changes: Partial<ExerciseFilters>,
): string {
  const next: ExerciseFilters = { ...current, ...changes };
  if (!("page" in changes)) next.page = 1;

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.muscle) params.set("muscle", next.muscle);
  if (next.equipment) params.set("equipment", next.equipment);
  if (next.type) params.set("type", next.type);
  if (next.mechanics) params.set("mechanics", next.mechanics);
  if (next.force) params.set("force", next.force);
  if (next.level) params.set("level", next.level);
  if (next.region) params.set("region", next.region);
  if (next.videoOnly) params.set("video", "yes");
  if (next.sort !== "name-asc") params.set("sort", next.sort);
  if (next.view !== "card") params.set("view", next.view);
  if (next.page > 1) params.set("page", String(next.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Human-readable labels for whichever filters are actually on, in the order
 * they appear in the filter bar.
 *
 * VISUAL_STYLE_GUIDE.docx voice rules: an empty state names the specific
 * reason it is empty rather than saying "no results". Each label carries its
 * own field name because "Chest" on its own doesn't say whether it came from
 * the muscle or the body-region control.
 *
 * Returns [] when nothing is filtered — the caller uses that to tell "you
 * filtered everything out" apart from "there is nothing here at all".
 */
export function describeActiveFilters(filters: ExerciseFilters): string[] {
  const labels: string[] = [];
  if (filters.q) labels.push(`search “${filters.q}”`);
  if (filters.muscle) labels.push(`muscle: ${filters.muscle}`);
  if (filters.equipment) labels.push(`equipment: ${filters.equipment}`);
  if (filters.type) labels.push(`type: ${filters.type}`);
  if (filters.mechanics) labels.push(`mechanics: ${filters.mechanics}`);
  if (filters.force) labels.push(`force: ${filters.force}`);
  if (filters.level) labels.push(`level: ${filters.level}`);
  if (filters.region) labels.push(`body region: ${filters.region}`);
  if (filters.videoOnly) labels.push("has video");
  return labels;
}

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return Boolean(
    filters.q ||
      filters.muscle ||
      filters.equipment ||
      filters.type ||
      filters.mechanics ||
      filters.force ||
      filters.level ||
      filters.region ||
      filters.videoOnly,
  );
}

export const EXERCISE_TYPE_OPTIONS = [
  "Activation",
  "Conditioning",
  "Olympic Weightlifting",
  "Plyometrics",
  "Powerlifting",
  "SMR",
  "Strength",
  "Stretching",
  "Strongman",
  "Warmup",
] as const;

export const MECHANICS_OPTIONS = ["Compound", "Isolation"] as const;

export const EXPERIENCE_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const;

export const BODY_REGION_OPTIONS = ["Upper Body", "Lower Body", "Core / Trunk"] as const;

export const FORCE_OPTIONS = [
  "Push",
  "Push (Bilateral)",
  "Push (Unilateral)",
  "Pull",
  "Pull (Bilateral)",
  "Pull (Unilateral)",
  "Hinge (Bilateral)",
  "Hinge (Unilateral)",
  "Press (Bilateral)",
  "Isometric",
  "Static",
  "Static Stretching",
  "Dynamic Stretching",
  "Compression",
  "N/A",
] as const;
