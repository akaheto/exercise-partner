import type { ReactNode } from "react";

/**
 * Workout Mode takes over the full screen and hides the global nav
 * (VISUAL_STYLE_GUIDE.docx "Workout Mode"), so this route lives outside the
 * (app) group rather than inside AppShell.
 */
export default function SessionLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
