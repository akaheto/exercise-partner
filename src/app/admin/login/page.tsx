"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Key, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <Lock className="size-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>
            Enter both the site password and admin token to access the admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Site Password */}
            <div className="space-y-2">
              <label htmlFor="sitePassword" className="text-sm font-medium text-foreground">
                Site Password
              </label>
              <Input
                id="sitePassword"
                type="password"
                placeholder="Enter site password"
                value={sitePassword}
                onChange={(e) => setSitePassword(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Admin Token */}
            <div className="space-y-2">
              <label htmlFor="adminToken" className="text-sm font-medium text-foreground">
                Admin Token
              </label>
              <Input
                id="adminToken"
                type="password"
                placeholder="Enter admin token"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full gap-2" size="lg">
              {isLoading ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="size-4" />
                  Access Admin Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Security Note */}
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200">
            <p className="font-semibold">Security Notice</p>
            <p className="mt-1">Never share your admin token or site password. This page requires both for protection.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
