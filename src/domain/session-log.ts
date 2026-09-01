import { z } from "zod";

/**
 * Bounds for one logged set. This writes real, immutable performance
 * history (src/app/session/actions.ts logSet) — the app's "history is never
 * silently wrong" promise depends on rejecting bad data here, not just
 * downstream. Postgres's `numeric` column accepts the literal NaN and
 * absurd magnitudes without complaint, so `.finite()` and a sane upper bound
 * are load-bearing, not decorative.
 */
export const logSetSchema = z.object({
  exerciseId: z.string().trim().min(1),
  setNumber: z.number().int().min(1).max(50),
  weight: z.number().finite().min(0).max(2000).nullable(),
  weightUnit: z.enum(["kg", "lb"]).nullable(),
  reps: z.number().int().min(0).max(500).nullable(),
  notes: z.string().trim().max(500).nullable(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
