import type { ReactNode } from "react";
import { BottomTabBar } from "./bottom-tab-bar";
import { TopBar } from "./top-bar";

/**
 * The authenticated app's frame: a top bar on desktop, a fixed bottom tab bar
 * on mobile (the thumb-reachable zone — see VISUAL_STYLE_GUIDE.docx section
 * 3), and enough bottom padding on mobile that content never sits under the
 * fixed bar.
 */
export function AppShell({ children, profileSlot }: { children: ReactNode; profileSlot: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar profileSlot={profileSlot} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  );
}
