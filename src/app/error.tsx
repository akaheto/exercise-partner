"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

/**
 * Next's file-based error boundary for everything under the root layout
 * (login, admin, and the (app) group's own error.tsx-less routes) — distinct
 * from src/components/error-boundary.tsx, which only catches client-render
 * errors already inside the (app) layout. This one also catches errors
 * thrown during Server Component render (e.g. requireOwnedSession's "Session
 * not found" for a stale id), which a plain React error boundary cannot.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <ErrorState
        description="We've logged this error. Try again, or head back home."
        detail={error.digest ? `Error ID: ${error.digest}` : undefined}
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              Go home
            </Link>
          </div>
        }
      />
    </div>
  );
}

async function reportError(error: Error & { digest?: string }) {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }),
    });
  } catch {
    // Reporting failure shouldn't compound the original error; console is
    // the last resort in dev, and there's no user-facing action to take.
    console.error("Failed to report error:", error);
  }
}
