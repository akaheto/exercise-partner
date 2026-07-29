import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MuscleBalanceEntry } from "@/domain/training-metrics";

export function MuscleBalancePanel({ entries, weeks }: { entries: MuscleBalanceEntry[]; weeks: number }) {
  if (entries.length === 0) return null;

  const maxVolume = Math.max(...entries.map((e) => e.volume));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscle balance</CardTitle>
        <CardDescription>
          Volume by primary muscle over the last {weeks} week{weeks === 1 ? "" : "s"} of training. A read of what
          happened, not a recommendation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.muscle} className="flex items-center gap-3 text-small">
              <span className="w-24 shrink-0 truncate text-foreground">{e.muscle}</span>
              {/* The bar is decoration for the number beside it, so it carries
                  no separate label for assistive tech. */}
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  data-slot="muscle-balance-bar"
                  className="h-full rounded-full bg-chart-1"
                  style={{ width: `${maxVolume > 0 ? (e.volume / maxVolume) * 100 : 0}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-caption tabular-nums text-muted-foreground">
                {Math.round(e.volume).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
