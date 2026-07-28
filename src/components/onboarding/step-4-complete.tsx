"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step4CompleteProps {
  profileName: string;
  level: string;
  goal: string;
  onComplete: () => void;
}

export function OnboardingStep4Complete({
  profileName,
  level,
  goal,
  onComplete,
}: Step4CompleteProps) {
  return (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
          <Check className="size-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">You&apos;re all set!</h1>
        <p className="mt-2 text-muted-foreground">
          Your profile has been created and personalized.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Name</span>
          <span className="font-semibold text-foreground">{profileName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Experience Level</span>
          <span className="font-semibold text-foreground">{level}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Training Goal</span>
          <span className="font-semibold text-foreground">{goal}</span>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/30">
        <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">What&apos;s next?</p>
        <ul className="space-y-1 text-sm text-teal-800 dark:text-teal-200">
          <li>• Browse exercises to see personalized guidance for your level</li>
          <li>• Generate a workout tailored to your experience and goals</li>
          <li>• Update your profile anytime from the Settings page</li>
        </ul>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        Start Using Exercise Partner
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You can always adjust your profile settings later.
      </p>
    </div>
  );
}
