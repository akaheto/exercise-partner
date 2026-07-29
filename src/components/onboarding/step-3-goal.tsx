"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/ui/option-card";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="What's your primary goal?"
        description={`${profileName} · ${level}. Choose your main focus — you can change it later.`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => (
          <OptionCard
            key={goal.id}
            icon={goal.icon}
            label={goal.label}
            description={goal.description}
            onClick={() => onNext(goal.id)}
          />
        ))}
      </div>

      <div>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft data-icon="inline-start" />
          Back
        </Button>
      </div>
    </div>
  );
}
