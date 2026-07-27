import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileSwitcher } from "@/components/profile-switcher/profile-switcher";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell profileSlot={<ProfileSwitcher />}>{children}</AppShell>;
}
