import { describe, expect, it } from "vitest";
import { assessWorkout, type AssessmentExerciseInput } from "./workout-assessment";

function exercise(overrides: Partial<AssessmentExerciseInput> = {}): AssessmentExerciseInput {
  return { primaryMuscle: null, secondaryMuscles: [], bodyRegion: null, repsMin: 8, repsMax: 12, ...overrides };
}

describe("assessWorkout — muscle aggregation", () => {
  it("returns empty results for an empty workout", () => {
    const result = assessWorkout([]);
    expect(result.primaryMuscles).toEqual([]);
    expect(result.secondaryMuscles).toEqual([]);
    expect(result.missingRegions).toEqual([]);
  });

  it("counts primary muscles and sorts by frequency, most-hit first", () => {
    const result = assessWorkout([
      exercise({ primaryMuscle: "Chest" }),
      exercise({ primaryMuscle: "Chest" }),
      exercise({ primaryMuscle: "Quads" }),
    ]);
    expect(result.primaryMuscles).toEqual(["Chest", "Quads"]);
  });

  it("deduplicates secondary muscles and excludes ones already counted as primary", () => {
    const result = assessWorkout([
      exercise({ primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Shoulders"] }),
      exercise({ primaryMuscle: "Triceps", secondaryMuscles: ["Chest"] }),
    ]);
    expect(result.secondaryMuscles).toEqual(["Shoulders"]);
  });

  it("identifies body regions with zero coverage", () => {
    const result = assessWorkout([exercise({ bodyRegion: "Upper Body" })]);
    expect(result.missingRegions).toEqual(expect.arrayContaining(["Lower Body", "Core / Trunk"]));
    expect(result.missingRegions).not.toContain("Upper Body");
  });

  it("reports no missing regions once all three are covered", () => {
    const result = assessWorkout([
      exercise({ bodyRegion: "Upper Body" }),
      exercise({ bodyRegion: "Lower Body" }),
      exercise({ bodyRegion: "Core / Trunk" }),
    ]);
    expect(result.missingRegions).toEqual([]);
  });
});

describe("assessWorkout — rep profile classification", () => {
  it("classifies a low-rep workout as strength", () => {
    const result = assessWorkout([exercise({ repsMin: 3, repsMax: 5 }), exercise({ repsMin: 4, repsMax: 6 })]);
    expect(result.repProfile).toBe("strength");
  });

  it("classifies a moderate-rep workout as hypertrophy", () => {
    const result = assessWorkout([exercise({ repsMin: 8, repsMax: 12 })]);
    expect(result.repProfile).toBe("hypertrophy");
  });

  it("classifies a high-rep workout as endurance", () => {
    const result = assessWorkout([exercise({ repsMin: 18, repsMax: 22 })]);
    expect(result.repProfile).toBe("endurance");
  });

  it("returns unknown when no exercise has a recorded rep range", () => {
    const result = assessWorkout([exercise({ repsMin: null, repsMax: null })]);
    expect(result.repProfile).toBe("unknown");
  });

  it("ignores items with no rep range when others have one", () => {
    const result = assessWorkout([exercise({ repsMin: 8, repsMax: 12 }), exercise({ repsMin: null, repsMax: null })]);
    expect(result.repProfile).toBe("hypertrophy");
  });

  it("changes when rep ranges change — reflects what's actually prescribed", () => {
    const before = assessWorkout([exercise({ repsMin: 8, repsMax: 12 })]);
    const after = assessWorkout([exercise({ repsMin: 3, repsMax: 5 })]);
    expect(before.repProfile).not.toBe(after.repProfile);
  });
});

describe("assessWorkout — tips", () => {
  it("gives a distinct tip per rep profile", () => {
    const strength = assessWorkout([exercise({ repsMin: 3, repsMax: 5 })]);
    const hypertrophy = assessWorkout([exercise({ repsMin: 8, repsMax: 12 })]);
    const endurance = assessWorkout([exercise({ repsMin: 18, repsMax: 22 })]);
    const unknown = assessWorkout([exercise({ repsMin: null, repsMax: null })]);
    const tips = new Set([strength.weightRepTip, hypertrophy.weightRepTip, endurance.weightRepTip, unknown.weightRepTip]);
    expect(tips.size).toBe(4);
  });

  it("gives a lower-body-specific recovery tip when lower-body muscles dominate", () => {
    const result = assessWorkout([exercise({ primaryMuscle: "Quads" }), exercise({ primaryMuscle: "Hamstrings" })]);
    expect(result.recoveryTip).toMatch(/lower-body/i);
  });

  it("gives a generic recovery tip when no exercises are present", () => {
    const result = assessWorkout([]);
    expect(result.recoveryTip).toMatch(/add exercises/i);
  });
});
