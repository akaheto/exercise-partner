"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, errorInfo.componentStack ?? "");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-h2 font-semibold text-foreground">Something went wrong</h1>
              <p className="text-small text-muted-foreground">
                We&apos;ve logged this error. Please try again or refresh the page.
              </p>
            </div>
            {this.state.error?.message && (
              <p className="rounded bg-destructive/10 p-3 text-small text-destructive">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

async function reportError(error: Error, componentStack: string) {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        componentStack,
      }),
    });
  } catch (e) {
    console.error("Failed to report error:", e);
  }
}
