"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/app/(app)/profile/actions";

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const TRAINING_GOALS = ["Strength", "Hypertrophy", "Endurance", "Power", "General"] as const;

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
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Training Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your experience level and training goal customize guidance, exercise recommendations, and workout prescriptions.
        </p>
      </div>

      {/* Experience Level */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Experience Level</label>
        <p className="text-xs text-muted-foreground">
          How long have you been training consistently?
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                selectedLevel === level
                  ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100"
                  : "border-border bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedLevel === "Beginner" && "Less than 1 year or new to structured training"}
          {selectedLevel === "Intermediate" && "1-3 years of consistent training"}
          {selectedLevel === "Advanced" && "3+ years of serious training, comfortable with complex programming"}
        </div>
      </div>

      {/* Training Goal */}
      <div className="space-y-3 border-t border-border pt-6">
        <label className="text-sm font-semibold text-foreground">Primary Training Goal</label>
        <p className="text-xs text-muted-foreground">
          What&apos;s your main focus right now?
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TRAINING_GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedGoal === goal
                  ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100"
                  : "border-border bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedGoal === "Strength" && "Building maximum force output, lower rep ranges (3-6)"}
          {selectedGoal === "Hypertrophy" && "Building muscle size, moderate rep ranges (6-12)"}
          {selectedGoal === "Endurance" && "Building muscular endurance, higher rep ranges (12+)"}
          {selectedGoal === "Power" && "Building explosive force, lower reps with speed (1-5)"}
          {selectedGoal === "General" && "Balanced fitness across all qualities"}
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-2 border-t border-border pt-6">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
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
    </div>
  );
}
