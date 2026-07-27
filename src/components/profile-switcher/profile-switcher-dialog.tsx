"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createProfile, selectProfile, type CreateProfileState } from "@/app/(app)/profile/actions";

export interface ProfileSummary {
  id: string;
  displayName: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const initialCreateState: CreateProfileState = {};

export function ProfileSwitcherDialog({
  profiles,
  activeProfile,
}: {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const [createState, createAction, isCreating] = useActionState(createProfile, initialCreateState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar size="sm">
              <AvatarFallback>
                {activeProfile ? initials(activeProfile.displayName) : <UserPlus className="size-3.5" />}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {activeProfile?.displayName ?? "Choose profile"}
            </span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch profile</DialogTitle>
          <DialogDescription>
            Everyone shares this site; each profile keeps its own workouts and history separate.
          </DialogDescription>
        </DialogHeader>

        {profiles.length > 0 && (
          <ul className="space-y-1">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile?.id;
              return (
                <li key={profile.id}>
                  <form
                    action={async (formData) => {
                      await selectProfile(formData);
                      setOpen(false);
                    }}
                  >
                    <input type="hidden" name="profileId" value={profile.id} />
                    <button
                      type="submit"
                      disabled={isActive}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted disabled:cursor-default disabled:bg-accent disabled:text-accent-foreground"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                      </Avatar>
                      {profile.displayName}
                      {isActive && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        {profiles.length > 0 && <Separator />}

        <form action={createAction} className="space-y-2">
          <Label htmlFor="displayName">Add a profile</Label>
          <div className="flex gap-2">
            <Input id="displayName" name="displayName" placeholder="Name" required maxLength={60} />
            <Button type="submit" disabled={isCreating} size="default">
              {isCreating ? "Adding…" : "Add"}
            </Button>
          </div>
          {createState.error && (
            <p role="alert" className="text-sm text-destructive">
              {createState.error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
