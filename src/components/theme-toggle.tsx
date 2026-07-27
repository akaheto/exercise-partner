"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const THEME_CHANGE_EVENT = "exercise-partner:theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

// Matches the no-flash script's default (light) so the server-rendered
// markup and the first client render agree before hydration settles.
function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
