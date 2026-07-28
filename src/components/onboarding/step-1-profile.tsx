"use client";

import { useState } from "react";
import { ChevronRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProfile } from "@/app/(app)/profile/actions";

interface Step1ProfileProps {
  onNext: (name: string) => void;
}

export function OnboardingStep1Profile({ onNext }: Step1ProfileProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (name.length > 60) {
      setError("Name must be under 60 characters");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("displayName", name);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (createProfile as any)(null, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Profile created and set as active, move to next step
      onNext(name);
    } catch {
      setError("Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to Exercise Partner</h1>
        <p className="mt-2 text-muted-foreground">
          Let&apos;s set up your profile to personalize your workouts and guidance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
            What&apos;s your name?
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-11"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading} className="w-full gap-2" size="lg">
            {isLoading ? (
              <>
                <Loader className="size-4 animate-spin" />
                Creating profile...
              </>
            ) : (
              <>
                Next: Your Experience Level
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Everyone shares this site. Your profile keeps your workouts private.
      </p>
    </div>
  );
}
