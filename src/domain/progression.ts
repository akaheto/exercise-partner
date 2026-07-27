/**
 * Epic J2 — Progression interfaces. Defines the shape a future progression
 * system would need (given an exercise's logged history and its prescribed
 * rep range, suggest a next weight/reps) without implementing the logic.
 * Deliberately left unimplemented: building a real strategy now would be
 * speculative without more usage data, and TECHNICAL_SPEC.docx already flags
 * estimated-1RM-style features as the kind of thing that shouldn't overstate
 * confidence. This exists only so a future implementation slots in without
 * needing a data model change.
 */

export interface ProgressionInput {
  exerciseId: string;
  /** Chronological, oldest first — same shape session_sets already stores. */
  history: { date: Date; weight: number | null; reps: number | null }[];
  targetRepsMin: number | null;
  targetRepsMax: number | null;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  suggestedWeight: number | null;
  suggestedReps: number | null;
  /** Plain-language reason, since a bare number without one would overstate
   * confidence — same principle CLAUDE.md's architectural rules apply to
   * derived exercise data. */
  rationale: string;
}

export interface ProgressionStrategy {
  name: string;
  suggest(input: ProgressionInput): ProgressionSuggestion | null;
}

/**
 * No strategy is implemented yet. Throws rather than silently returning a
 * fabricated suggestion or null-as-"no change", so a future caller can't
 * accidentally ship "nothing implemented" as if it were a real
 * recommendation.
 */
export const NOT_IMPLEMENTED_PROGRESSION_STRATEGY: ProgressionStrategy = {
  name: "not-implemented",
  suggest(): ProgressionSuggestion | null {
    throw new Error("No progression strategy is implemented yet — Epic J2 defines the contract only.");
  },
};
