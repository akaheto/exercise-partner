"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Catches an error thrown by the root layout itself (src/app/layout.tsx) —
 * the one place error.tsx can't help, since error.tsx renders inside the
 * layout it's meant to replace. Next.js requires this file to render its
 * own <html>/<body>; kept deliberately free of component imports (no
 * ErrorState/Button, no theme script) since a broken root layout is exactly
 * the moment those extra dependencies are least trustworthy — plain
 * elements styled with the same semantic tokens (VISUAL_STYLE_GUIDE.docx)
 * error-boundary.tsx uses, not raw Tailwind palette/size classes.
 */
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-4 text-center">
        <h1 className="text-h2 font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-small text-muted-foreground">
          We&apos;ve logged this error. Try reloading the page.
        </p>
        {error.digest ? (
          <p className="max-w-sm break-words font-mono text-caption text-muted-foreground">Error ID: {error.digest}</p>
        ) : null}
        <button
          onClick={reset}
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
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
    console.error("Failed to report error:", error);
  }
}
