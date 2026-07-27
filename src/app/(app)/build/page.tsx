import Link from "next/link";
import { PenLine, Wand2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startNewWorkout } from "./actions";

export default function BuildPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Build a workout</h1>
      <p className="mb-8 text-sm text-muted-foreground">Start from scratch, or let the app ask a few questions and generate one.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form action={startNewWorkout} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <PenLine className="size-6 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-foreground">Start from scratch</h2>
            <p className="text-sm text-muted-foreground">
              Pick exercises yourself, group them into supersets, and set your own sets and reps.
            </p>
          </div>
          <Button type="submit" className="mt-auto">
            Start building
          </Button>
        </form>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <Wand2 className="size-6 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-foreground">Generate for me</h2>
            <p className="text-sm text-muted-foreground">
              Answer a few questions about your goal, time, focus and equipment — fully editable afterwards.
            </p>
          </div>
          <Link href="/build/generate" className={cn(buttonVariants({ variant: "default" }), "mt-auto")}>
            Answer questions
          </Link>
        </div>
      </div>
    </div>
  );
}
