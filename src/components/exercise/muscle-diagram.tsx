/**
 * Custom body-map diagram (Epic D4). Not sourced from the spreadsheet — there
 * is no muscle-diagram asset in the data (see TECHNICAL_SPEC.docx "Known
 * Limitations"). Deliberately simplified geometric regions rather than an
 * attempt at anatomical realism the underlying data can't back up; accuracy
 * is at muscle-group granularity, matching the documented tradeoff.
 */

type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx: number };

interface Region {
  muscle: string;
  view: "front" | "back";
  shape: Shape;
}

const REGIONS: Region[] = [
  // --- Front ---
  { muscle: "Neck", view: "front", shape: { kind: "rect", x: 62, y: 30, w: 16, h: 12, rx: 3 } },
  { muscle: "Shoulders", view: "front", shape: { kind: "circle", cx: 38, cy: 54, r: 13 } },
  { muscle: "Shoulders", view: "front", shape: { kind: "circle", cx: 102, cy: 54, r: 13 } },
  { muscle: "Chest", view: "front", shape: { kind: "rect", x: 46, y: 48, w: 48, h: 30, rx: 8 } },
  { muscle: "Biceps", view: "front", shape: { kind: "rect", x: 20, y: 62, w: 16, h: 38, rx: 8 } },
  { muscle: "Biceps", view: "front", shape: { kind: "rect", x: 104, y: 62, w: 16, h: 38, rx: 8 } },
  { muscle: "Forearms", view: "front", shape: { kind: "rect", x: 16, y: 102, w: 14, h: 40, rx: 7 } },
  { muscle: "Forearms", view: "front", shape: { kind: "rect", x: 110, y: 102, w: 14, h: 40, rx: 7 } },
  { muscle: "Palmar Fascia", view: "front", shape: { kind: "circle", cx: 21, cy: 148, r: 7 } },
  { muscle: "Palmar Fascia", view: "front", shape: { kind: "circle", cx: 119, cy: 148, r: 7 } },
  { muscle: "Abs", view: "front", shape: { kind: "rect", x: 52, y: 80, w: 36, h: 44, rx: 6 } },
  { muscle: "Obliques", view: "front", shape: { kind: "rect", x: 38, y: 84, w: 12, h: 40, rx: 6 } },
  { muscle: "Obliques", view: "front", shape: { kind: "rect", x: 90, y: 84, w: 12, h: 40, rx: 6 } },
  { muscle: "Hip Flexors", view: "front", shape: { kind: "rect", x: 48, y: 126, w: 44, h: 16, rx: 6 } },
  { muscle: "Adductors", view: "front", shape: { kind: "rect", x: 60, y: 146, w: 20, h: 56, rx: 8 } },
  { muscle: "Quads", view: "front", shape: { kind: "rect", x: 40, y: 146, w: 20, h: 70, rx: 8 } },
  { muscle: "Quads", view: "front", shape: { kind: "rect", x: 80, y: 146, w: 20, h: 70, rx: 8 } },
  { muscle: "Calves", view: "front", shape: { kind: "rect", x: 42, y: 222, w: 16, h: 58, rx: 8 } },
  { muscle: "Calves", view: "front", shape: { kind: "rect", x: 82, y: 222, w: 16, h: 58, rx: 8 } },

  // --- Back ---
  { muscle: "Neck", view: "back", shape: { kind: "rect", x: 62, y: 30, w: 16, h: 12, rx: 3 } },
  { muscle: "Traps", view: "back", shape: { kind: "rect", x: 46, y: 40, w: 48, h: 22, rx: 10 } },
  { muscle: "Shoulders", view: "back", shape: { kind: "circle", cx: 38, cy: 54, r: 13 } },
  { muscle: "Shoulders", view: "back", shape: { kind: "circle", cx: 102, cy: 54, r: 13 } },
  { muscle: "Triceps", view: "back", shape: { kind: "rect", x: 20, y: 62, w: 16, h: 38, rx: 8 } },
  { muscle: "Triceps", view: "back", shape: { kind: "rect", x: 104, y: 62, w: 16, h: 38, rx: 8 } },
  { muscle: "Forearms", view: "back", shape: { kind: "rect", x: 16, y: 102, w: 14, h: 40, rx: 7 } },
  { muscle: "Forearms", view: "back", shape: { kind: "rect", x: 110, y: 102, w: 14, h: 40, rx: 7 } },
  { muscle: "Upper Back", view: "back", shape: { kind: "rect", x: 44, y: 64, w: 52, h: 24, rx: 8 } },
  { muscle: "Lats", view: "back", shape: { kind: "rect", x: 32, y: 72, w: 18, h: 42, rx: 8 } },
  { muscle: "Lats", view: "back", shape: { kind: "rect", x: 90, y: 72, w: 18, h: 42, rx: 8 } },
  { muscle: "Middle Back", view: "back", shape: { kind: "rect", x: 50, y: 90, w: 40, h: 20, rx: 6 } },
  { muscle: "Lower Back", view: "back", shape: { kind: "rect", x: 48, y: 108, w: 44, h: 20, rx: 6 } },
  { muscle: "Glutes", view: "back", shape: { kind: "rect", x: 46, y: 128, w: 48, h: 26, rx: 10 } },
  { muscle: "IT Band", view: "back", shape: { kind: "rect", x: 34, y: 150, w: 8, h: 62, rx: 4 } },
  { muscle: "IT Band", view: "back", shape: { kind: "rect", x: 98, y: 150, w: 8, h: 62, rx: 4 } },
  { muscle: "Hamstrings", view: "back", shape: { kind: "rect", x: 42, y: 150, w: 20, h: 68, rx: 8 } },
  { muscle: "Hamstrings", view: "back", shape: { kind: "rect", x: 78, y: 150, w: 20, h: 68, rx: 8 } },
  { muscle: "Calves", view: "back", shape: { kind: "rect", x: 42, y: 222, w: 16, h: 58, rx: 8 } },
  { muscle: "Calves", view: "back", shape: { kind: "rect", x: 82, y: 222, w: 16, h: 58, rx: 8 } },
];

/** Muscles with no visual mapping — shown standing on the source page's own
 * terms, listed in text rather than silently omitted. Plantar Fascia (the
 * sole of the foot) isn't visible on a standing front/back view. */
export const UNMAPPED_MUSCLES = new Set(["Plantar Fascia"]);

type Role = "primary" | "secondary" | "none";

function roleFor(muscle: string, primaryMuscle: string | null, secondaryMuscles: string[]): Role {
  if (primaryMuscle && muscle === primaryMuscle) return "primary";
  if (secondaryMuscles.includes(muscle)) return "secondary";
  return "none";
}

/* Three steps, no more: the source data only distinguishes primary from
 * secondary involvement, so inventing a stabiliser tier would be presenting
 * derived data as sourced fact (CLAUDE.md rule 4). */
const FILL_BY_ROLE: Record<Role, string> = {
  primary: "var(--muscle-primary)",
  secondary: "var(--muscle-secondary)",
  none: "var(--muscle-none)",
};

function Silhouette({
  view,
  primaryMuscle,
  secondaryMuscles,
}: {
  view: "front" | "back";
  primaryMuscle: string | null;
  secondaryMuscles: string[];
}) {
  return (
    <svg viewBox="0 0 140 300" role="img" aria-label={`${view} view`} className="h-full w-full">
      {/* Decorative head + torso/limb outline for orientation; not a muscle region. */}
      <circle cx={70} cy={18} r={14} className="fill-muted" />
      {REGIONS.filter((r) => r.view === view).map((region, i) => {
        const role = roleFor(region.muscle, primaryMuscle, secondaryMuscles);
        const fill = FILL_BY_ROLE[role];
        const shape = region.shape;
        const common = {
          fill,
          stroke: "var(--card)",
          strokeWidth: 1.5,
        };
        return (
          <g key={`${region.muscle}-${view}-${i}`}>
            <title>
              {region.muscle}
              {role !== "none" ? ` (${role})` : ""}
            </title>
            {shape.kind === "circle" ? (
              <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />
            ) : (
              <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function MuscleDiagram({
  primaryMuscle,
  secondaryMuscles,
}: {
  primaryMuscle: string | null;
  secondaryMuscles: string[];
}) {
  const unmapped = secondaryMuscles.filter((m) => UNMAPPED_MUSCLES.has(m));
  if (primaryMuscle && UNMAPPED_MUSCLES.has(primaryMuscle)) unmapped.push(primaryMuscle);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-2">
        <Silhouette view="front" primaryMuscle={primaryMuscle} secondaryMuscles={secondaryMuscles} />
        <Silhouette view="back" primaryMuscle={primaryMuscle} secondaryMuscles={secondaryMuscles} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muscle-primary" /> Primary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muscle-secondary" /> Secondary
        </span>
      </div>
      {unmapped.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Not shown above (no clear body position on a standing view): {unmapped.join(", ")}.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Approximate, generated diagram — not part of the source data. Muscle-group granularity only.
      </p>
    </div>
  );
}
