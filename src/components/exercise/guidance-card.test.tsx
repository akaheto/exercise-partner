import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GuidanceCard } from "./guidance-card";
import type { ExerciseGuidanceRow } from "@/domain/getExerciseGuidance";

describe("GuidanceCard", () => {
  const mockGuidance: ExerciseGuidanceRow = {
    exerciseId: "EX-0001",
    exerciseName: "Test Exercise",
    patternId: "beginner_strength",
    experienceLevel: "Beginner",
    trainingGoal: "Strength",
    recommendedSets: 3,
    recommendedRepsMin: 3,
    recommendedRepsMax: 6,
    targetRpe: 7,
    tempo: "2-0-1",
    breathingCue: "Brace before descent. Hold breath during lift.",
    formCue: "Maintain form throughout.",
    regressionTier1ExerciseId: "EX-0002",
    regressionTier1Note: "Easier variant",
    regressionTier2ExerciseId: null,
    regressionTier2Note: null,
    regressionTier3ExerciseId: null,
    regressionTier3Note: null,
    alternative1ExerciseId: "EX-0003",
    alternative1Note: "Dumbbell alternative",
    alternative2ExerciseId: null,
    alternative2Note: null,
    requiredMobility: "shoulder",
    contraindicatedFor: null,
    minimumExperienceLevel: null,
    exerciseSpecificFormCue: "Elbows at 45 degrees",
    beginnerSafetyCue: "Check mobility first",
  };

  it("renders the guidance card with prescribed sets/reps/RPE/tempo", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);

    expect(screen.getByText(/3 sets/)).toBeTruthy();
    expect(screen.getByText(/3–6/)).toBeTruthy();
    expect(screen.getByText(/RPE 7\/10/)).toBeTruthy();
    expect(screen.getByText("2-0-1")).toBeTruthy();
  });

  it("displays breathing cue", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/Brace before descent/)).toBeTruthy();
  });

  it("displays exercise-specific form cue when available", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/Elbows at 45 degrees/)).toBeTruthy();
  });

  it("displays beginner safety cue when user is beginner", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/Check mobility first/)).toBeTruthy();
  });

  it("hides beginner safety cue when user is not beginner", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Intermediate" userGoal="Strength" />);
    expect(screen.queryByText(/Check mobility first/)).toBeFalsy();
  });

  it("displays mobility requirement", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/shoulder mobility/i)).toBeTruthy();
  });

  it("displays regression tier options", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/EX-0002/)).toBeTruthy();
    expect(screen.getByText(/Easier variant/)).toBeTruthy();
  });

  it("displays equipment alternatives", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Beginner" userGoal="Strength" />);
    expect(screen.getByText(/EX-0003/)).toBeTruthy();
    expect(screen.getByText(/Dumbbell alternative/)).toBeTruthy();
  });

  it("displays user level and goal in header", () => {
    render(<GuidanceCard guidance={mockGuidance} userLevel="Intermediate" userGoal="Hypertrophy" />);
    expect(screen.getByText(/Intermediate • Hypertrophy/)).toBeTruthy();
  });
});
