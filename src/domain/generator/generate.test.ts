import { describe, expect, it } from "vitest";
import { generateWorkout } from "./generate";
import type { GeneratorCandidate, GeneratorInput } from "./types";

function candidate(overrides: Partial<GeneratorCandidate> & { exerciseId: string; name: string }): GeneratorCandidate {
  return {
    primaryMuscle: null,
    mechanics: "Compound",
    experienceLevel: null,
    bodyRegion: null,
    horizontalPush: false,
    verticalPush: false,
    horizontalPull: false,
    verticalPull: false,
    squat: false,
    hinge: false,
    core: false,
    ...overrides,
  };
}

const FULL_BODY_POOL: GeneratorCandidate[] = [
  candidate({ exerciseId: "SQ", name: "Barbell Squat", squat: true, primaryMuscle: "Quads", bodyRegion: "Lower Body" }),
  candidate({ exerciseId: "HG", name: "Romanian Deadlift", hinge: true, primaryMuscle: "Hamstrings", bodyRegion: "Lower Body" }),
  candidate({ exerciseId: "HP", name: "Bench Press", horizontalPush: true, primaryMuscle: "Chest", bodyRegion: "Upper Body" }),
  candidate({ exerciseId: "HL", name: "Bent Over Row", horizontalPull: true, primaryMuscle: "Lats", bodyRegion: "Upper Body" }),
  candidate({ exerciseId: "VP", name: "Overhead Press", verticalPush: true, primaryMuscle: "Shoulders", bodyRegion: "Upper Body" }),
  candidate({ exerciseId: "VL", name: "Pull Up", verticalPull: true, primaryMuscle: "Lats", bodyRegion: "Upper Body" }),
  candidate({ exerciseId: "CO", name: "Plank", core: true, primaryMuscle: "Abs", bodyRegion: "Core / Trunk", mechanics: "Isolation" }),
  candidate({ exerciseId: "AC1", name: "Bicep Curl", primaryMuscle: "Biceps", bodyRegion: "Upper Body", mechanics: "Isolation" }),
  candidate({ exerciseId: "AC2", name: "Tricep Pushdown", primaryMuscle: "Triceps", bodyRegion: "Upper Body", mechanics: "Isolation" }),
  candidate({ exerciseId: "AC3", name: "Calf Raise", primaryMuscle: "Calves", bodyRegion: "Lower Body", mechanics: "Isolation" }),
];

const baseInput = (overrides: Partial<GeneratorInput> = {}): GeneratorInput => ({
  goal: "hypertrophy",
  durationMinutes: 40,
  focus: "full_body",
  experienceLevel: "Intermediate",
  candidates: FULL_BODY_POOL,
  ...overrides,
});

describe("generateWorkout — pattern coverage (F3)", () => {
  it("covers every anchor pattern for full_body with one exercise each when the pool allows", () => {
    const result = generateWorkout(baseInput({ durationMinutes: 60 }));
    const ids = result.items.map((i) => i.exerciseId);
    expect(ids).toEqual(expect.arrayContaining(["SQ", "HG", "HP", "HL", "VP", "VL", "CO"]));
  });

  it("orders compound exercises before isolation (F4)", () => {
    const result = generateWorkout(baseInput({ durationMinutes: 60 }));
    const mechanicsById = new Map(FULL_BODY_POOL.map((c) => [c.exerciseId, c.mechanics]));
    const firstIsolationIndex = result.items.findIndex((i) => mechanicsById.get(i.exerciseId) === "Isolation");
    const lastCompoundIndex = result.items.map((i) => mechanicsById.get(i.exerciseId)).lastIndexOf("Compound");
    if (firstIsolationIndex !== -1 && lastCompoundIndex !== -1) {
      expect(lastCompoundIndex).toBeLessThan(firstIsolationIndex);
    }
  });

  it("restricts a push focus to push-pattern exercises before falling back to accessories", () => {
    const result = generateWorkout(baseInput({ focus: "push", durationMinutes: 20 }));
    const ids = result.items.map((i) => i.exerciseId);
    expect(ids).toContain("HP"); // Bench Press, horizontal push anchor
  });
});

describe("generateWorkout — experience filtering", () => {
  it("excludes exercises above the user's stated experience level", () => {
    const pool = [
      ...FULL_BODY_POOL,
      candidate({ exerciseId: "ADV", name: "Muscle-up", experienceLevel: "Advanced", primaryMuscle: "Lats", bodyRegion: "Upper Body" }),
    ];
    const result = generateWorkout(baseInput({ candidates: pool, experienceLevel: "Beginner", durationMinutes: 60 }));
    expect(result.items.map((i) => i.exerciseId)).not.toContain("ADV");
  });

  it("includes exercises with no recorded experience level rather than excluding them for missing data", () => {
    const pool = [candidate({ exerciseId: "X", name: "Mystery Exercise", experienceLevel: null, core: true })];
    const result = generateWorkout(baseInput({ candidates: pool, focus: "core", experienceLevel: "Beginner" }));
    expect(result.items.map((i) => i.exerciseId)).toContain("X");
  });
});

describe("generateWorkout — duration fitting (F4)", () => {
  it("selects fewer exercises for a short duration than a long one", () => {
    const short = generateWorkout(baseInput({ durationMinutes: 20 }));
    const long = generateWorkout(baseInput({ durationMinutes: 60 }));
    expect(short.items.length).toBeLessThan(long.items.length);
  });

  it("keeps the estimate within a reasonable band of the requested duration", () => {
    const result = generateWorkout(baseInput({ durationMinutes: 30 }));
    expect(result.estimatedMinutes).toBeGreaterThan(0);
    expect(result.estimatedMinutes).toBeLessThanOrEqual(30 * 1.5);
  });

  it("never drops below the minimum item count even for a very short duration", () => {
    const result = generateWorkout(baseInput({ durationMinutes: 5 }));
    expect(result.items.length).toBeGreaterThanOrEqual(2);
  });
});

describe("generateWorkout — prescriptions by goal", () => {
  it("applies strength-appropriate low reps and long rest", () => {
    const result = generateWorkout(baseInput({ goal: "strength", durationMinutes: 60 }));
    expect(result.items[0].repsMax).toBeLessThanOrEqual(5);
    expect(result.items[0].restSeconds).toBeGreaterThanOrEqual(120);
  });

  it("applies endurance-appropriate high reps and short rest", () => {
    const result = generateWorkout(baseInput({ goal: "endurance", durationMinutes: 60 }));
    expect(result.items[0].repsMin).toBeGreaterThanOrEqual(15);
    expect(result.items[0].restSeconds).toBeLessThanOrEqual(60);
  });
});

describe("generateWorkout — unhappy paths", () => {
  it("returns an empty result with a warning when no exercises are available at all", () => {
    const result = generateWorkout(baseInput({ candidates: [] }));
    expect(result.items).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("falls back to the full pool with a warning when nothing matches the requested focus", () => {
    const pool = [candidate({ exerciseId: "ONLY", name: "Only Exercise", primaryMuscle: "Calves", bodyRegion: "Lower Body" })];
    // "push" focus matches nothing in a lower-body-only pool.
    const result = generateWorkout(baseInput({ candidates: pool, focus: "push" }));
    expect(result.items.map((i) => i.exerciseId)).toContain("ONLY");
    expect(result.warnings.some((w) => w.includes("No exercises matched your focus"))).toBe(true);
  });

  it("warns rather than silently under-delivering when the pool is smaller than the target count", () => {
    const pool = [candidate({ exerciseId: "A", name: "A", core: true }), candidate({ exerciseId: "B", name: "B", core: true })];
    const result = generateWorkout(baseInput({ candidates: pool, focus: "core", durationMinutes: 60 }));
    expect(result.items.length).toBe(2);
    expect(result.warnings.some((w) => w.includes("Only 2"))).toBe(true);
  });
});

describe("generateWorkout — determinism", () => {
  it("produces the same result for the same input", () => {
    const a = generateWorkout(baseInput());
    const b = generateWorkout(baseInput());
    expect(a).toEqual(b);
  });
});
