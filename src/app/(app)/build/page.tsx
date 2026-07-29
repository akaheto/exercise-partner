import Link from "next/link";
import { Library, PenLine, Wand2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { startNewWorkout } from "./actions";

export default function BuildPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <PageHeader
        title="Build a workout"
        description="Start from scratch, or let the app ask a few questions and generate one."
        className="mb-8"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="h-full">
          <CardContent>
            <PenLine className="size-6 text-primary-text" aria-hidden="true" />
          </CardContent>
          <CardHeader>
            <CardTitle>Start from scratch</CardTitle>
            <CardDescription>
              Pick exercises yourself, group them into supersets, and set your own sets and reps.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <form action={startNewWorkout}>
              <Button type="submit" className="w-full">
                Start building
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent>
            <Wand2 className="size-6 text-primary-text" aria-hidden="true" />
          </CardContent>
          <CardHeader>
            <CardTitle>Generate for me</CardTitle>
            <CardDescription>
              Answer a few questions about your goal, time, focus and equipment — fully editable
              afterwards.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link
              href="/build/generate"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              Answer questions
            </Link>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent>
            <Library className="size-6 text-primary-text" aria-hidden="true" />
          </CardContent>
          <CardHeader>
            <CardTitle>Choose from the library</CardTitle>
            <CardDescription>
              Browse packaged multi-day programs. Currently for review only — adding one to your
              saved workouts isn&apos;t built yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link
              href="/build/library"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Browse programs
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
