"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/ui/option-card";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${profileName}, what's your experience level?`}
        description="This sets the exercises and rep ranges suggested to you. You can change it later."
      />

      <div className="flex flex-col gap-3">
        {LEVELS.map((level) => (
          <OptionCard
            key={level.id}
            icon={level.icon}
            label={level.label}
            description={level.description}
            onClick={() => onNext(level.id)}
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
