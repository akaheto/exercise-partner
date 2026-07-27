import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileSwitcher } from "@/components/profile-switcher/profile-switcher";
import { ExerciseSelectionProvider } from "@/components/exercise-selection/selection-context";
import { SelectionBar } from "@/components/exercise-selection/selection-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ExerciseSelectionProvider>
      <AppShell profileSlot={<ProfileSwitcher />}>
        {children}
        <SelectionBar />
      </AppShell>
    </ExerciseSelectionProvider>
  );
}
