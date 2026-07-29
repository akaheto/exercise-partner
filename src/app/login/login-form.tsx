"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-flat"
    >
      <div className="space-y-1 text-center">
        <h1 className="text-h2 font-semibold text-foreground">Exercise Partner</h1>
        <p className="text-small text-muted-foreground">Enter the site password to continue.</p>
      </div>

      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-small text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
