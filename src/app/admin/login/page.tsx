"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validateAdminAccess } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [sitePassword, setSitePassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await validateAdminAccess(sitePassword, adminToken);

      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span
            className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive-subtle"
            aria-hidden="true"
          >
            <Lock className="size-6 text-destructive-text" />
          </span>
          <CardTitle>Admin access</CardTitle>
          <CardDescription>
            Both the site password and the admin token are required.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Field label="Site password">
              <Input
                id="sitePassword"
                type="password"
                autoComplete="current-password"
                value={sitePassword}
                onChange={(e) => setSitePassword(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            <Field label="Admin token">
              <Input
                id="adminToken"
                type="password"
                autoComplete="off"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            {error && <Callout tone="danger">{error}</Callout>}

            <Button type="submit" loading={isLoading} loadingLabel="Verifying" className="w-full">
              <Key data-icon="inline-start" />
              Sign in to admin
            </Button>
          </form>

          <Callout tone="warning" title="Keep these secret">
            Anyone holding both values can delete any profile and its entire training history.
          </Callout>
        </CardContent>
      </Card>
    </div>
  );
}
