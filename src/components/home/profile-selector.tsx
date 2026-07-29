"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createProfile } from "@/app/(app)/profile/actions";
import { selectProfile } from "@/app/(app)/profile/actions";

interface Profile {
  id: string;
  displayName: string;
}

interface ProfileSelectorProps {
  profiles: Profile[];
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileSelector({ profiles }: ProfileSelectorProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [error, setError] = useState("");

  const filteredProfiles = profiles.filter((p) =>
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProfile = async (profileId: string) => {
    try {
      const formData = new FormData();
      formData.set("profileId", profileId);
      await selectProfile(formData);
      router.push("/exercises");
    } catch {
      setError("Failed to select profile");
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newProfileName.trim()) {
      setError("Please enter a profile name");
      return;
    }

    if (newProfileName.length > 60) {
      setError("Name must be under 60 characters");
      return;
    }

    if (!/^\d{4,6}$/.test(newProfilePin)) {
      setError("PIN must be 4-6 digits");
      return;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.set("displayName", newProfileName);
      formData.set("pin", newProfilePin);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (createProfile as any)(null, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Profile created and set as active, redirect to onboarding
      router.push("/onboarding");
    } catch {
      setError("Failed to create profile");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {profiles.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 text-foreground">Your profiles</h2>
            <p className="text-small text-muted-foreground">Pick yours, or add one below.</p>
          </div>

          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search profiles"
              placeholder="Search profiles…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile.id)}
                  className="focus-ring flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary-border hover:bg-primary-subtle"
                >
                  <Avatar>
                    <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">
                    {profile.displayName}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon={UserRound}
                  title="No profiles match that search"
                  description="Clear the search to see everyone, or add a new profile below."
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a profile</CardTitle>
          <CardDescription>
            You&apos;ll set your experience level and training goal on the next screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
            <Field label="Name">
              <Input
                type="text"
                placeholder="Enter your name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                disabled={isCreating}
                autoFocus={profiles.length === 0}
              />
            </Field>

            <Field
              label="PIN"
              description="Needed to delete this profile later. There is no way to reset it, so keep it somewhere safe."
            >
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="4-6 digits"
                value={newProfilePin}
                onChange={(e) => setNewProfilePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isCreating}
              />
            </Field>

            {error && <Callout tone="danger">{error}</Callout>}

            <Button
              type="submit"
              loading={isCreating}
              loadingLabel="Creating profile"
              size="lg"
              className="w-full"
            >
              <Plus data-icon="inline-start" />
              Create and continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
