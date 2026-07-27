"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ExerciseSessionPoint } from "@/domain/session-history";

export function ExerciseTrendChart({ points }: { points: ExerciseSessionPoint[] }) {
  const withWeight = points.filter((p) => p.maxWeight !== null);
  if (withWeight.length < 2) return null;

  const chartData = withWeight.map((p) => ({
    date: p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    maxWeight: p.maxWeight,
  }));

  return (
    <div className="h-48 w-full rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Top set weight over time</p>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <Line type="monotone" dataKey="maxWeight" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
