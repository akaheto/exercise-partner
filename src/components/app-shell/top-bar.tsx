"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

export function TopBar({ profileSlot }: { profileSlot: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden h-16 items-center gap-6 border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/80 md:flex">
      <Link href="/exercises" className="flex items-center gap-2 font-semibold text-foreground">
        <Dumbbell className="size-5 text-primary" aria-hidden="true" />
        Exercise Partner
      </Link>

      <nav className="flex items-center gap-1" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {profileSlot}
      </div>
    </header>
  );
}
