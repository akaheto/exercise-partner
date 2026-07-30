"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyProfile, type ProfileVerificationState } from "./actions";

const initialState: ProfileVerificationState = {};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(verifyProfile, initialState);

  const handleNewUserClick = () => {
    router.push("/onboarding");
  };

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-h2 font-semibold text-foreground">Exercise Partner</h1>
        <p className="text-small text-muted-foreground">Welcome back</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Returning Users Section */}
        <form
          action={formAction}
          className="space-y-6 rounded-xl border border-border bg-card p-8 shadow-flat"
        >
          <div className="space-y-1">
            <h2 className="text-h3 font-semibold text-foreground">Returning Users</h2>
            <p className="text-small text-muted-foreground">Sign in with your profile</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileName">Profile Name</Label>
            <Input
              id="profileName"
              name="profileName"
              type="text"
              required
              autoFocus
              placeholder="Enter your profile name"
              aria-invalid={state.error ? true : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              required
              placeholder="Enter your PIN"
              aria-invalid={state.error ? true : undefined}
            />
          </div>

          {state.error && (
            <p role="alert" className="text-small text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Verifying…" : "Sign In"}
          </Button>
        </form>

        {/* New Users Section */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-8 shadow-flat flex flex-col justify-center">
          <div className="space-y-1">
            <h2 className="text-h3 font-semibold text-foreground">New Users</h2>
            <p className="text-small text-muted-foreground">Create your first profile</p>
          </div>

          <p className="text-small text-muted-foreground">
            Get started by creating a new profile and completing your setup.
          </p>

          <Button
            type="button"
            onClick={handleNewUserClick}
            className="w-full"
            variant="outline"
          >
            Start Onboarding
          </Button>
        </div>
      </div>
    </div>
  );
}
