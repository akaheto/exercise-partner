"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisLineProps,
  chartGridProps,
  chartLineCursorProps,
  chartSeriesFillClassName,
  chartSeriesStrokeClassName,
  chartTickProps,
  chartTooltipProps,
} from "@/components/history/chart-theme";
import type { ExerciseSessionPoint } from "@/domain/session-history";

export function ExerciseTrendChart({ points }: { points: ExerciseSessionPoint[] }) {
  const withWeight = points.filter((p) => p.maxWeight !== null);
  if (withWeight.length < 2) return null;

  const chartData = withWeight.map((p) => ({
    date: p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    maxWeight: p.maxWeight,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top set weight over time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" tick={chartTickProps} axisLine={chartAxisLineProps} tickLine={false} />
              <YAxis tick={chartTickProps} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltipProps} cursor={chartLineCursorProps} />
              <Line
                type="monotone"
                dataKey="maxWeight"
                className={chartSeriesStrokeClassName}
                strokeWidth={2}
                dot={{ r: 3, className: `${chartSeriesFillClassName} ${chartSeriesStrokeClassName}` }}
                activeDot={{ r: 5, className: `${chartSeriesFillClassName} ${chartSeriesStrokeClassName}` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
