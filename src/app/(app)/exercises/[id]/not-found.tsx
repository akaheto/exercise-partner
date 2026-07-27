import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ExerciseNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Exercise not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        There&apos;s no exercise at that link. It may have been removed in a later import.
      </p>
      <Link href="/exercises" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
        Back to the library
      </Link>
    </div>
  );
}
