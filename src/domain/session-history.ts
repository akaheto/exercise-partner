/**
 * Pure aggregation for Workout History (Epic I). Volume is the standard
 * strength-training measure — weight x reps, summed — used both for a single
 * session's total and for the weekly trend chart.
 */

export interface SetForVolume {
  weight: string | number | null;
  reps: number | null;
}

export function computeVolume(sets: SetForVolume[]): number {
  return sets.reduce((sum, s) => {
    if (s.weight === null || s.reps === null) return sum;
    const weight = typeof s.weight === "string" ? Number(s.weight) : s.weight;
    if (!Number.isFinite(weight)) return sum;
    return sum + weight * s.reps;
  }, 0);
}

export interface VolumePoint {
  date: Date;
  volume: number;
}

export interface WeeklyVolume {
  /** ISO date (Monday) of the week this bucket covers. */
  weekStart: string;
  volume: number;
}

/** Exported for reuse by src/domain/training-metrics.ts, which needs the same
 * week-bucketing but keyed by muscle as well as date. */
export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Buckets volume points into ISO weeks (Monday start), summed and sorted
 * chronologically — the shape a line/bar chart wants directly. */
export function groupVolumeByWeek(points: VolumePoint[]): WeeklyVolume[] {
  const byWeek = new Map<string, number>();
  for (const p of points) {
    const week = mondayOf(p.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + p.volume);
  }
  return Array.from(byWeek.entries())
    .map(([weekStart, volume]) => ({ weekStart, volume }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function sessionDurationMinutes(startedAt: Date, completedAt: Date | null): number | null {
  if (!completedAt) return null;
  const ms = completedAt.getTime() - startedAt.getTime();
  return ms > 0 ? Math.round(ms / 60000) : 0;
}

export interface ExerciseSetPoint {
  sessionId: string;
  date: Date;
  weight: string | number | null;
  reps: number | null;
}

export interface ExerciseSessionPoint {
  sessionId: string;
  date: Date;
  maxWeight: number | null;
  volume: number;
}

/** Collapses a flat list of logged sets for one exercise (spanning many
 * sessions) into one point per session — the top single-set weight that day,
 * and the session's total volume for that exercise — sorted chronologically.
 * The shape a "performance over time" chart wants directly. */
export function groupExerciseHistoryBySession(points: ExerciseSetPoint[]): ExerciseSessionPoint[] {
  const bySession = new Map<string, { date: Date; sets: SetForVolume[] }>();
  for (const p of points) {
    if (!bySession.has(p.sessionId)) bySession.set(p.sessionId, { date: p.date, sets: [] });
    const entry = bySession.get(p.sessionId)!;
    entry.sets.push({ weight: p.weight, reps: p.reps });
    if (p.date < entry.date) entry.date = p.date;
  }

  return Array.from(bySession.entries())
    .map(([sessionId, { date, sets }]) => {
      const weights = sets
        .map((s) => (typeof s.weight === "string" ? Number(s.weight) : s.weight))
        .filter((w): w is number => w !== null && Number.isFinite(w));
      return {
        sessionId,
        date,
        maxWeight: weights.length > 0 ? Math.max(...weights) : null,
        volume: computeVolume(sets),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
