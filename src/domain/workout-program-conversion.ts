/**
 * Converts a scraped workout-program exercise row's free-text sets/reps/rest
 * (see scripts/import-workout-programs.ts) into the app's structured
 * prescription fields (workout_items.sets/reps_min/reps_max, workout_blocks
 * .rest_seconds). Pure — no I/O — so the many real text variants found on
 * the source site can be covered by tests without a database.
 */

export interface ParsedPrescription {
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
  notes: string | null;
}

function parseSetsText(setsText: string | null): { sets: number; note: string | null } {
  if (!setsText) return { sets: 1, note: null };
  const trimmed = setsText.trim();
  const match = trimmed.match(/^(\d+)$/);
  if (match) return { sets: Number(match[1]), note: null };
  // The source sometimes puts a duration here instead of a set count, for
  // timed burnout sets (e.g. "5 Minutes" — see PROJECT_PLAN.docx section 4,
  // item 54). Not a number to fabricate: fall back to a single set and keep
  // the original text as a note instead.
  return { sets: 1, note: trimmed };
}

function parseRepsText(
  repsText: string | null,
): { repsMin: number | null; repsMax: number | null; note: string | null } {
  if (!repsText) return { repsMin: null, repsMax: null, note: null };
  const trimmed = repsText.trim();

  const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { repsMin: Number(range[1]), repsMax: Number(range[2]), note: null };

  const single = trimmed.match(/^(\d+)$/);
  if (single) return { repsMin: Number(single[1]), repsMax: Number(single[1]), note: null };

  // "AMRAP", "Burn", "60 sec" and similar aren't a rep count — kept as a
  // note rather than guessed at.
  return { repsMin: null, repsMax: null, note: trimmed };
}

function parseRestText(restText: string | null): number | null {
  if (!restText) return null;
  const match = restText.match(/(\d+)(?:\s*-\s*(\d+))?\s*(sec|second|min|minute)/i);
  if (!match) return null;
  const low = Number(match[1]);
  const high = match[2] ? Number(match[2]) : low;
  const multiplier = /min/i.test(match[3]) ? 60 : 1;
  return Math.round(((low + high) / 2) * multiplier);
}

export function parsePrescription(
  setsText: string | null,
  repsText: string | null,
  restText: string | null,
  existingNotes: string | null,
): ParsedPrescription {
  const setsResult = parseSetsText(setsText);
  const repsResult = parseRepsText(repsText);
  const restSeconds = parseRestText(restText);

  const notes =
    [existingNotes, setsResult.note, repsResult.note]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(" — ") || null;

  return {
    sets: setsResult.sets,
    repsMin: repsResult.repsMin,
    repsMax: repsResult.repsMax,
    restSeconds,
    notes,
  };
}

/** The last path segment of a muscleandstrength.com URL, normalized — the
 * join key used to match a workout program's linked exercises (and, at the
 * program level, to detect the same program re-imported from a different
 * source batch) against source_exercises.url / source_workout_programs.url,
 * which use the identical scheme. Shared by every import path (HTML scrape
 * in scripts/import-workout-programs.ts, structured-extract import in
 * scripts/import-workout-extract.ts) so a slug computed one way always
 * matches a slug computed the other. */
export function slugFromUrl(url: string): string {
  return url
    .split("?")[0]
    .replace(/\/$/, "")
    .split("/")
    .pop()!
    .replace(/\.html$/i, "")
    .toLowerCase();
}

export interface ProgramCategoryInput {
  mainGoal?: string | null;
  targetGender?: string | null;
  equipmentRequired?: string | null;
}

/**
 * Best-effort category label for a workout program, from its name and a
 * few metadata fields — no fixed vocabulary on the source site, so this is
 * a heuristic, not a lookup. Shared across import paths so the same
 * program name always lands in the same category regardless of which
 * source batch it came from — a program re-imported from a fresh extract
 * must not silently change category just because the heuristic ran twice
 * with two different implementations.
 */
export function categorizeProgram(name: string, meta: ProgramCategoryInput): string {
  const lower = name.toLowerCase();
  const goal = (meta.mainGoal ?? "").toLowerCase();
  const gender = (meta.targetGender ?? "").toLowerCase();
  const isWomenOnly = gender === "female" || (lower.includes("women") && (lower.includes("for women") || lower.includes("women's")));

  // Check for equipment-specific programs first (high priority)
  if (lower.includes("dumbbell") && lower.includes("only")) return "Dumbbell Only";
  if (lower.includes("kettlebell")) return "Kettlebell";
  if (lower.includes("bodyweight") || lower.includes("no equipment")) return "Bodyweight";
  if ((lower.includes("home") || lower.includes("at home")) && !isWomenOnly) return "Home Workouts";
  if (lower.includes("planet fitness")) return "Gym - Limited Equipment";

  // Check for specialty programs
  if (lower.includes("deload")) return "Recovery & Deload";
  if (lower.includes("abs") || lower.includes("core")) return "Specialty - Core";
  if (lower.includes("squat")) return "Specialty - Squat Focus";
  if (lower.includes("deadlift")) return "Specialty - Deadlift Focus";
  if (lower.includes("bench")) return "Specialty - Bench Press Focus";
  if (lower.includes("hiit") || lower.includes("cardio")) return "Cardio & HIIT";
  if (lower.includes("finisher")) return "Finisher Programs";

  // Check for strength and hypertrophy
  if (goal.includes("strength") || lower.includes("strength")) {
    if (isWomenOnly) return "Strength Training - Women";
    return "Strength Training";
  }
  if (goal.includes("hypertrophy") || lower.includes("hypertrophy") || lower.includes("mass")) {
    if (isWomenOnly) return "Muscle Building - Women";
    return "Muscle Building";
  }
  if (goal.includes("fat") || lower.includes("fat loss") || lower.includes("shred")) {
    if (isWomenOnly) return "Fat Loss - Women";
    return "Fat Loss";
  }

  // Check for split types
  if (lower.includes("full body")) {
    if (isWomenOnly) return "Full Body - Women";
    return "Full Body";
  }
  if (lower.includes("upper") && lower.includes("lower")) return "Upper/Lower Split";
  if (lower.includes("push pull leg") || lower.includes("ppl")) return "Push/Pull/Legs Split";
  if (lower.includes("bro split")) return "Muscle Building";

  // Default based on main goal
  if (goal.includes("fat")) {
    if (isWomenOnly) return "Fat Loss - Women";
    return "Fat Loss";
  }
  if (goal.includes("strength")) {
    if (isWomenOnly) return "Strength Training - Women";
    return "Strength Training";
  }
  if (goal.includes("muscle") || goal.includes("build")) {
    if (isWomenOnly) return "Muscle Building - Women";
    return "Muscle Building";
  }

  // Catch-all
  return "Mixed Programs";
}
