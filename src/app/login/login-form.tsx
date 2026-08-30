"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Exercise Partner</CardTitle>
        <CardDescription>Enter the site password to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="next" value={next} />

          <Field label="Password" error={state.error}>
            <Input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" loading={isPending} loadingLabel="Checking" className="w-full">
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
