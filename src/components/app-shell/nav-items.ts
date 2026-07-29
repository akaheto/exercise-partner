import type { LucideIcon } from "lucide-react";
import { CalendarClock, Dumbbell, History, ListChecks, User, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Six destinations for now, not the five VISUAL_STYLE_GUIDE.docx section 4
 * originally specified. "My Profile" (added for a single person's own
 * profile) and "Profile" (the all-profiles/switcher view, /profile) coexist
 * temporarily — the plan is for "My Profile" to replace "Profile" in this
 * list for non-administrator users once that gating exists, per
 * PROJECT_PLAN.docx. Icons deliberately distinguish them: Users (plural) for
 * the all-profiles view, User (singular) for one's own.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/workouts", label: "Workouts", icon: ListChecks },
  { href: "/build", label: "Build", icon: CalendarClock },
  { href: "/history", label: "History", icon: History },
  { href: "/my-profile", label: "My Profile", icon: User },
  { href: "/profile", label: "Profile", icon: Users },
];
