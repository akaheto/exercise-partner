import { describe, expect, it } from "vitest";
import { resolveGuidanceContext } from "./workout-guidance-context";

const profile = { experienceLevel: "Beginner", trainingGoal: "General" };

describe("resolveGuidanceContext", () => {
  it("uses the workout's own level/goal when both are set", () => {
    const workout = { experienceLevel: "Advanced", trainingGoal: "Strength" };
    expect(resolveGuidanceContext(workout, profile)).toEqual({
      userLevel: "Advanced",
      userGoal: "Strength",
    });
  });

  it("falls back to the profile when the workout has neither stored", () => {
    const workout = { experienceLevel: null, trainingGoal: null };
    expect(resolveGuidanceContext(workout, profile)).toEqual({
      userLevel: "Beginner",
      userGoal: "General",
    });
  });

  it("resolves level and goal independently, not as an all-or-nothing pair", () => {
    const workout = { experienceLevel: "Advanced", trainingGoal: null };
    expect(resolveGuidanceContext(workout, profile)).toEqual({
      userLevel: "Advanced",
      userGoal: "General",
    });
  });

  // Unhappy path: no active profile at all (shouldn't happen behind
  // requireOwnedWorkout, but the function itself must not throw).
  it("falls back to hardcoded defaults when there is no profile and no stored value", () => {
    const workout = { experienceLevel: null, trainingGoal: null };
    expect(resolveGuidanceContext(workout, null)).toEqual({
      userLevel: "Beginner",
      userGoal: "General",
    });
  });
});
