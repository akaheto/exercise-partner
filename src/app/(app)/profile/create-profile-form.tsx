"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProfile, type CreateProfileState } from "./actions";

const initialState: CreateProfileState = {};

export function CreateProfileForm() {
  const [state, formAction, isPending] = useActionState(createProfile, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="new-profile-name">Name</Label>
        <Input id="new-profile-name" name="displayName" placeholder="Name" required maxLength={60} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-profile-pin">PIN</Label>
        <Input
          id="new-profile-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          placeholder="4-6 digits"
          required
          maxLength={6}
        />
        <p className="text-xs text-muted-foreground">Needed to delete this profile later.</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add"}
      </Button>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
