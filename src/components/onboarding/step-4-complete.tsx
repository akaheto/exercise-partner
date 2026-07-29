"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";

interface Step4CompleteProps {
  profileName: string;
  level: string;
  goal: string;
  onComplete: () => void;
  isSaving?: boolean;
  error?: string | null;
}

export function OnboardingStep4Complete({
  profileName,
  level,
  goal,
  onComplete,
  isSaving = false,
  error,
}: Step4CompleteProps) {
  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="mb-2 inline-flex size-16 items-center justify-center rounded-full bg-success-subtle"
          aria-hidden="true"
        >
          <Check className="size-8 text-success-text" />
        </span>
        <h1 className="text-display text-foreground">You&apos;re all set</h1>
        <p className="text-body text-muted-foreground">
          Your profile is created, and guidance is tuned to it.
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-4">
        {[
          ["Name", profileName],
          ["Experience level", level],
          ["Training goal", goal],
        ].map(([term, value]) => (
          <div key={term} className="flex items-center justify-between gap-4">
            <dt className="text-small text-muted-foreground">{term}</dt>
            <dd className="text-body font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <Callout title="What's next?">
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>Browse exercises to see guidance for your level and goal.</li>
          <li>Generate a workout tailored to both.</li>
          <li>Change either from your profile whenever they stop fitting.</li>
        </ul>
      </Callout>

      {error && <Callout tone="danger">{error}</Callout>}

      <Button onClick={onComplete} loading={isSaving} loadingLabel="Saving" size="lg" className="w-full">
        Start using Exercise Partner
      </Button>
    </div>
  );
}
