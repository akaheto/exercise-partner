import type { LucideIcon } from "lucide-react";
import { CalendarClock, Dumbbell, History, ListChecks, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** The five destinations, per VISUAL_STYLE_GUIDE.docx section 4 ("Navigation"). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/workouts", label: "Workouts", icon: ListChecks },
  { href: "/build", label: "Build", icon: CalendarClock },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];
