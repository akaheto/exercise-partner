import type { MuscleBalanceEntry } from "@/domain/training-metrics";

export function MuscleBalancePanel({ entries, weeks }: { entries: MuscleBalanceEntry[]; weeks: number }) {
  if (entries.length === 0) return null;

  const maxVolume = Math.max(...entries.map((e) => e.volume));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-1 text-sm font-semibold text-foreground">Muscle balance</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Volume by primary muscle over the last {weeks} week{weeks === 1 ? "" : "s"} of training. A read of what
        happened, not a recommendation.
      </p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.muscle} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 truncate text-foreground">{e.muscle}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${maxVolume > 0 ? (e.volume / maxVolume) * 100 : 0}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {Math.round(e.volume).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
