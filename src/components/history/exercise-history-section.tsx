import Link from "next/link";
import { ExerciseTrendChart } from "@/components/history/exercise-trend-chart";
import type { ExerciseSessionPoint } from "@/domain/session-history";

export function ExerciseHistorySection({ points }: { points: ExerciseSessionPoint[] }) {
  if (points.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Your history</h2>
        <p className="text-sm text-muted-foreground">
          Nothing logged yet — sets you record for this exercise in Workout Mode will show up here.
        </p>
      </section>
    );
  }

  const recent = [...points].reverse().slice(0, 8);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Your history</h2>
      <ExerciseTrendChart points={points} />
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {recent.map((p) => (
          <li key={p.sessionId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <Link href={`/history/${p.sessionId}`} className="text-foreground hover:underline">
              {p.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Link>
            <span className="font-mono text-muted-foreground">
              {p.maxWeight !== null ? `top ${p.maxWeight}` : "—"}
              {p.volume > 0 && ` · ${Math.round(p.volume).toLocaleString()} vol`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
