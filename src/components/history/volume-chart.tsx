"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyVolume } from "@/domain/session-history";

function formatWeekLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function VolumeChart({ data }: { data: WeeklyVolume[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({ week: formatWeekLabel(d.weekStart), volume: Math.round(d.volume) }));

  return (
    <div className="h-56 w-full rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Weekly volume</p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value) => [Number(value).toLocaleString(), "Volume (weight × reps)"]}
          />
          <Bar dataKey="volume" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
