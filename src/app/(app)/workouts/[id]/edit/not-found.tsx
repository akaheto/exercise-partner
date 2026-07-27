import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WorkoutNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Workout not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This workout doesn&apos;t exist, or belongs to a different profile.
      </p>
      <Link href="/build" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
        Start a new workout
      </Link>
    </div>
  );
}
