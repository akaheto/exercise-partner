"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WorkoutSearchBar({ showArchived }: { showArchived: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [syncedQ, setSyncedQ] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (initialQ !== syncedQ) {
    setSyncedQ(initialQ);
    setQ(initialQ);
  }

  function go(nextQ: string, nextArchived: boolean) {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextArchived) params.set("archived", "1");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => go(value, showArchived), 300);
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search workouts…" className="pl-9" />
      </div>
      <Button type="button" variant={showArchived ? "secondary" : "outline"} size="sm" onClick={() => go(q, !showArchived)}>
        {showArchived ? "Showing archived" : "Show archived"}
      </Button>
    </div>
  );
}
