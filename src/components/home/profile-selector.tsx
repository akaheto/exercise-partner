"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
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

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.set("displayName", newProfileName);
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
    <div className="space-y-8">
      {/* Existing Profiles */}
      {profiles.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Profiles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an existing profile or create a new one
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Profile Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  <Avatar>
                    <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">Click to select</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No profiles matching &quot;{searchTerm}&quot;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Profile */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Plus className="size-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-foreground">Create New Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Set up a new profile to get personalized exercise guidance
        </p>

        <form onSubmit={handleCreateProfile} className="space-y-3">
          <div>
            <Input
              type="text"
              placeholder="Enter your name..."
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              disabled={isCreating}
              className="h-11"
              autoFocus={profiles.length === 0}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          <Button type="submit" disabled={isCreating} className="w-full gap-2" size="lg">
            {isCreating ? (
              <>
                <Loader className="size-4 animate-spin" />
                Creating profile...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Create & Continue
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          You&apos;ll set your experience level and training goal on the next screen
        </p>
      </div>
    </div>
  );
}
