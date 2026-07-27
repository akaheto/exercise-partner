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
    <form action={formAction} className="space-y-2">
      <Label htmlFor="new-profile-name">Name</Label>
      <div className="flex gap-2">
        <Input id="new-profile-name" name="displayName" placeholder="Name" required maxLength={60} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
