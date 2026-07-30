import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileSwitcher } from "@/components/profile-switcher/profile-switcher";
import { ExerciseSelectionProvider } from "@/components/exercise-selection/selection-context";
import { SelectionBar } from "@/components/exercise-selection/selection-bar";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ExerciseSelectionProvider>
        <AppShell profileSlot={<ProfileSwitcher />}>
          {children}
          <SelectionBar />
        </AppShell>
      </ExerciseSelectionProvider>
    </ErrorBoundary>
  );
}
