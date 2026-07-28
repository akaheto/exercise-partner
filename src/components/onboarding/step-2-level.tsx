"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step2LevelProps {
  profileName: string;
  onNext: (level: string) => void;
  onBack: () => void;
}

const LEVELS = [
  {
    id: "Beginner",
    label: "Beginner",
    description: "Less than 1 year or new to structured training",
    icon: "🌱",
  },
  {
    id: "Intermediate",
    label: "Intermediate",
    description: "1-3 years of consistent training",
    icon: "💪",
  },
  {
    id: "Advanced",
    label: "Advanced",
    description: "3+ years of serious training",
    icon: "🏆",
  },
];

export function OnboardingStep2Level({ profileName, onNext, onBack }: Step2LevelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {profileName}, what&apos;s your experience level?
        </h1>
        <p className="mt-2 text-muted-foreground">
          This helps us suggest appropriate exercises and rep ranges.
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onNext(level.id)}
            className="w-full rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{level.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">{level.label}</h3>
                <p className="text-sm text-muted-foreground">{level.description}</p>
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
