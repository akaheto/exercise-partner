"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisLineProps,
  chartBarCursorProps,
  chartGridProps,
  chartSeriesFillClassName,
  chartTickProps,
  chartTooltipProps,
} from "@/components/history/chart-theme";
import type { WeeklyVolume } from "@/domain/session-history";

function formatWeekLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function VolumeChart({ data }: { data: WeeklyVolume[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({ week: formatWeekLabel(d.weekStart), volume: Math.round(d.volume) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly volume</CardTitle>
        <CardDescription>Weight × reps, summed per week. A record of what you did.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Fixed height on the wrapper, 100% inside it. ResponsiveContainer
            measures its parent, so a percentage height here would resolve
            against a box that is itself sized by its content. */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="week" tick={chartTickProps} axisLine={chartAxisLineProps} tickLine={false} />
              <YAxis tick={chartTickProps} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                {...chartTooltipProps}
                cursor={chartBarCursorProps}
                formatter={(value) => [Number(value).toLocaleString(), "Volume (weight × reps)"]}
              />
              <Bar dataKey="volume" className={chartSeriesFillClassName} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
