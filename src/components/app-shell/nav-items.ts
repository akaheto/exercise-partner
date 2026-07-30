import type { LucideIcon } from "lucide-react";
import { CalendarClock, Dumbbell, History, ListChecks, User, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/workouts", label: "Workouts", icon: ListChecks },
  { href: "/build", label: "Build", icon: CalendarClock },
  { href: "/history", label: "History", icon: History },
  { href: "/my-profile", label: "My Profile", icon: User },
  { href: "/profile", label: "Profile", icon: Users },
];

export const NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter((item) => item.href !== "/profile");

export function getNavItems(isAdmin: boolean): NavItem[] {
  return isAdmin ? ALL_NAV_ITEMS : NAV_ITEMS;
}
