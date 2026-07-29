"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateProfileAction } from "@/app/(app)/profile/actions";

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const TRAINING_GOALS = ["Strength", "Hypertrophy", "Endurance", "Power", "General"] as const;

const LEVEL_BLURB: Record<string, string> = {
  Beginner: "Less than a year, or new to structured training",
  Intermediate: "One to three years of consistent training",
  Advanced: "Three years or more, comfortable with complex programming",
};

const GOAL_BLURB: Record<string, string> = {
  Strength: "Maximum force output, lower rep ranges (3-6)",
  Hypertrophy: "Muscle size, moderate rep ranges (6-12)",
  Endurance: "Muscular endurance, higher rep ranges (12+)",
  Power: "Explosive force, low reps moved fast (1-5)",
  General: "Balanced work across all qualities",
};

/**
 * A single-select chip. Not a Button variant: these are radio semantics, and
 * the selected state has to survive being read out, not just look different.
 * 44px minimum per the style guide's touch-target floor.
 */
function ChoiceChip({
  selected,
  className,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-body transition-colors",
        selected
          ? "border-primary-border bg-primary-subtle text-primary-text font-medium"
          : "border-border bg-muted text-foreground hover:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

interface ProfileEditorProps {
  profileId: string;
  currentLevel: string;
  currentGoal: string;
}

export function ProfileEditor({ profileId, currentLevel, currentGoal }: ProfileEditorProps) {
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [selectedGoal, setSelectedGoal] = useState(currentGoal);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = selectedLevel !== currentLevel || selectedGoal !== currentGoal;

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateProfileAction(profileId, selectedLevel, selectedGoal);

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while updating your profile" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training profile</CardTitle>
        <CardDescription>
          Your experience level and training goal set the sets, reps and effort shown on every
          exercise page.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Experience level</legend>
          <p className="text-small text-muted-foreground">
            How long have you been training consistently?
          </p>
          <div role="radiogroup" aria-label="Experience level" className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <ChoiceChip
                key={level}
                selected={selectedLevel === level}
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </ChoiceChip>
            ))}
          </div>
          <p className="text-small text-muted-foreground">{LEVEL_BLURB[selectedLevel]}</p>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-border pt-6">
          <legend className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Primary training goal</legend>
          <p className="text-small text-muted-foreground">What is your main focus right now?</p>
          <div
            role="radiogroup"
            aria-label="Primary training goal"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {TRAINING_GOALS.map((goal) => (
              <ChoiceChip
                key={goal}
                selected={selectedGoal === goal}
                onClick={() => setSelectedGoal(goal)}
              >
                {goal}
              </ChoiceChip>
            ))}
          </div>
          <p className="text-small text-muted-foreground">{GOAL_BLURB[selectedGoal]}</p>
        </fieldset>

        {message && (
          <Callout tone={message.type === "success" ? "success" : "danger"}>
            {message.text}
          </Callout>
        )}

        <div className="flex gap-2 border-t border-border pt-6">
          <Button onClick={handleSave} disabled={!hasChanges} loading={isSaving}>
            Save changes
          </Button>
          {hasChanges && (
            <Button
              onClick={() => {
                setSelectedLevel(currentLevel);
                setSelectedGoal(currentGoal);
                setMessage(null);
              }}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
