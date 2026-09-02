"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Debounced free-text search over workout program names — the library's
 * only browse control. Same debounce/URL-param pattern as the Exercise
 * Library's search box (src/components/exercise/filter-bar.tsx), scaled
 * down to just the one field this page needs. */
export function WorkoutLibrarySearchBar({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [syncedSearch, setSyncedSearch] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjust local state during render when the URL's search param changes
  // externally (back/forward navigation) — React's documented pattern for
  // this, not an effect: https://react.dev/learn/you-might-not-need-an-effect
  if (initialSearch !== syncedSearch) {
    setSyncedSearch(initialSearch);
    setSearchValue(initialSearch);
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(value ? `${pathname}?search=${encodeURIComponent(value)}` : pathname);
    }, 300);
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search workout programs by name…"
        className="pl-9"
        aria-label="Search workout programs"
      />
    </div>
  );
}
