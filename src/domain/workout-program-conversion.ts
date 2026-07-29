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
