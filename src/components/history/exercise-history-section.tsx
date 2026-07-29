import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseTrendChart } from "@/components/history/exercise-trend-chart";
import { formatWeight } from "@/components/history/format";
import type { ExerciseSessionPoint } from "@/domain/session-history";

export function ExerciseHistorySection({ points }: { points: ExerciseSessionPoint[] }) {
  if (points.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-h3 text-foreground">Your history</h2>
        <p className="text-small text-muted-foreground">
          Nothing logged yet — sets you record for this exercise in Workout Mode will show up here.
        </p>
      </section>
    );
  }

  const recent = [...points].reverse().slice(0, 8);

  return (
    <section className="space-y-3">
      <h2 className="text-h3 text-foreground">Your history</h2>
      <ExerciseTrendChart points={points} />
      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recent.map((p) => (
              <li key={p.sessionId} className="flex items-center justify-between gap-3 py-3 text-small">
                <Link href={`/history/${p.sessionId}`} className="focus-ring text-foreground hover:underline">
                  {p.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </Link>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {p.maxWeight !== null ? `top ${formatWeight(p.maxWeight)}` : "—"}
                  {p.volume > 0 && ` · ${Math.round(p.volume).toLocaleString()} vol`}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
