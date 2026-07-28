"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step3GoalProps {
  profileName: string;
  level: string;
  onNext: (goal: string) => void;
  onBack: () => void;
}

const GOALS = [
  {
    id: "Strength",
    label: "Strength",
    description: "Build maximum force output (3-6 reps)",
    icon: "🔥",
  },
  {
    id: "Hypertrophy",
    label: "Hypertrophy",
    description: "Build muscle size (6-12 reps)",
    icon: "💪",
  },
  {
    id: "Endurance",
    label: "Endurance",
    description: "Build muscular endurance (12+ reps)",
    icon: "⚡",
  },
  {
    id: "Power",
    label: "Power",
    description: "Build explosive force (1-5 reps)",
    icon: "💥",
  },
  {
    id: "General",
    label: "General",
    description: "Balanced fitness across all qualities",
    icon: "⚖️",
  },
];

export function OnboardingStep3Goal({ profileName, level, onNext, onBack }: Step3GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">What&apos;s your primary goal?</h1>
        <p className="mt-2 text-muted-foreground">
          {profileName} ({level}): Choose your main focus. You can always change this later.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onNext(goal.id)}
            className="rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{goal.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">{goal.label}</h3>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
