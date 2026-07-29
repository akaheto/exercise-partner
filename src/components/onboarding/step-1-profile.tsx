"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createProfile } from "@/app/(app)/profile/actions";

interface Step1ProfileProps {
  onNext: (name: string) => void;
}

export function OnboardingStep1Profile({ onNext }: Step1ProfileProps) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
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

    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4-6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("displayName", name);
      formData.set("pin", pin);
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Welcome to Exercise Partner"
        description="Two answers now, and the guidance on every exercise is tuned to you."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="What's your name?">
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </Field>

        <Field
          label="Choose a PIN"
          description="Needed to delete your profile later. There's no way to reset it, so keep it somewhere safe."
        >
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4-6 digits"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={isLoading}
          />
        </Field>

        {error && <Callout tone="danger">{error}</Callout>}

        <Button type="submit" loading={isLoading} loadingLabel="Creating profile" size="lg" className="w-full">
          Next: your experience level
          <ChevronRight data-icon="inline-end" />
        </Button>
      </form>

      <p className="text-center text-caption text-muted-foreground">
        Everyone shares one password for this site. Your profile keeps your workouts and history
        separate from theirs — it is not a lock between you.
      </p>
    </div>
  );
}
