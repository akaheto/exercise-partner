/**
 * Design-token guard.
 *
 * Phase 0 gave every semantic colour a four-role model and a tinted-surface
 * token; Phase 1 gave the recurring shapes real primitives. This script stops
 * the app drifting back: it fails the build if any banned raw utility count
 * goes UP.
 *
 * It is a RATCHET, not a wall. `design-token-baseline.json` records today's
 * counts so the script passes today; every later phase lowers the numbers and
 * re-runs with `--update`. The counts can only go down.
 *
 * Scope: src/app + src/components, EXCLUDING src/components/ui. The primitives
 * are where raw values are supposed to live — that is the whole point of
 * having them.
 *
 *   npx tsx scripts/check-design-tokens.ts            # check
 *   npx tsx scripts/check-design-tokens.ts --update   # re-baseline after a cleanup
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const BASELINE_PATH = join(ROOT, "scripts", "design-token-baseline.json");
const SCAN_DIRS = ["src/app", "src/components"];
const EXCLUDE_DIRS = ["src/components/ui"];
const EXTENSIONS = [".ts", ".tsx"];

const PALETTE_HUES = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink",
  "rose", "slate", "gray", "zinc", "neutral", "stone",
].join("|");

const COLOR_PROPS = [
  "bg", "text", "border", "ring", "from", "to", "via", "fill", "stroke",
  "decoration", "outline", "shadow", "accent", "caret", "divide", "placeholder",
].join("|");

const SPACING_PROPS = [
  "p", "px", "py", "pt", "pr", "pb", "pl",
  "m", "mx", "my", "mt", "mr", "mb", "ml",
  "gap", "gap-x", "gap-y", "space-x", "space-y",
  "w", "h", "size", "min-w", "min-h", "max-w", "max-h",
  "top", "right", "bottom", "left", "inset", "inset-x", "inset-y",
  "translate-x", "translate-y", "indent", "scroll-m", "scroll-p",
].join("|");

interface Rule {
  id: string;
  why: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  {
    id: "raw-palette-color",
    why: "Use the four-role semantic tokens (bg-*-subtle, text-*-text, border-*-border) instead of a raw palette step. Raw steps have to be re-picked for dark mode by hand, which is where dark mode breaks.",
    pattern: new RegExp(
      `\\b(?:${COLOR_PROPS})-(?:${PALETTE_HUES})-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`,
      "g"
    ),
  },
  {
    id: "raw-text-size",
    why: "Use the named type scale (text-display / text-h1 / text-h2 / text-h3 / text-body-lg / text-body / text-small / text-caption / text-metric / text-timer) so the class states the role, not the pixel count.",
    pattern:
      /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b|\btext-\[[^\]]*(?:rem|px|em)[^\]]*\]/g,
  },
  {
    id: "off-scale-spacing",
    why: "Half steps (0.5 / 1.5 / 2.5 / 3.5) sit off the 4px grid and are the main source of one-pixel drift between screens.",
    pattern: new RegExp(
      `(?<![\\w-])-?(?:${SPACING_PROPS})-(?:0\\.5|1\\.5|2\\.5|3\\.5)\\b`,
      "g"
    ),
  },
  {
    id: "raw-shadow",
    why: "Two elevation levels only: shadow-flat for cards and panels, shadow-overlay for dialogs and fixed bars.",
    pattern: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)\b/g,
  },
  {
    id: "off-scale-radius",
    why: "Cards standardise on rounded-xl (16px). rounded-2xl / 3xl / 4xl are off the card standard.",
    pattern: /\brounded-(?:2xl|3xl|4xl)\b/g,
  },
  {
    id: "gradient",
    why: "Gradients are not in the visual language. Use a flat surface token.",
    pattern: /\bbg-(?:gradient-to-[a-z]+|linear-|radial|conic)/g,
  },
];

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (EXCLUDE_DIRS.some((excluded) => rel === excluded || rel.startsWith(`${excluded}/`))) {
      continue;
    }
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

interface Hit {
  file: string;
  line: number;
  match: string;
}

function scan(): Map<string, Hit[]> {
  const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
  const results = new Map<string, Hit[]>(RULES.map((rule) => [rule.id, []]));

  for (const file of files) {
    const rel = relative(ROOT, file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        for (const match of line.matchAll(rule.pattern)) {
          results.get(rule.id)!.push({
            file: rel,
            line: index + 1,
            match: match[0],
          });
        }
      }
    });
  }
  return results;
}

type Baseline = { generated: string; note: string; counts: Record<string, number> };

function readBaseline(): Baseline | null {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
  } catch {
    return null;
  }
}

function main() {
  const update = process.argv.includes("--update");
  const verbose = process.argv.includes("--verbose") || update;
  const results = scan();
  const counts: Record<string, number> = {};
  for (const rule of RULES) counts[rule.id] = results.get(rule.id)!.length;

  if (update) {
    const payload: Baseline = {
      generated: new Date().toISOString().slice(0, 10),
      note:
        "Ratchet baseline for scripts/check-design-tokens.ts. Counts may only go DOWN. " +
        "Re-run with --update after each cleanup phase. Target for every rule is 0.",
      counts,
    };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote baseline to ${relative(ROOT, BASELINE_PATH)}`);
  }

  const baseline = readBaseline();
  if (!baseline) {
    console.error(
      `No baseline at ${relative(ROOT, BASELINE_PATH)}. Run: npx tsx scripts/check-design-tokens.ts --update`
    );
    process.exit(1);
  }

  let failed = false;
  const summary: string[] = [];

  for (const rule of RULES) {
    const current = counts[rule.id];
    const allowed = baseline.counts[rule.id] ?? 0;
    const delta = current - allowed;
    const state = delta > 0 ? "REGRESSED" : delta < 0 ? "improved" : "ok";
    summary.push(
      `  ${rule.id.padEnd(20)} ${String(current).padStart(4)} / ${String(allowed).padEnd(4)} ${state}`
    );

    if (delta > 0) {
      failed = true;
      console.error(`\n✖ ${rule.id}: ${current} violations, baseline allows ${allowed}.`);
      console.error(`  ${rule.why}`);
      for (const hit of results.get(rule.id)!.slice(0, 20)) {
        console.error(`    ${hit.file}:${hit.line}  ${hit.match}`);
      }
    } else if (verbose && current > 0) {
      const byFile = new Map<string, number>();
      for (const hit of results.get(rule.id)!) {
        byFile.set(hit.file, (byFile.get(hit.file) ?? 0) + 1);
      }
      console.log(`\n${rule.id} — ${current} remaining:`);
      for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${String(n).padStart(3)}  ${file}`);
      }
    }
  }

  console.log(`\ndesign tokens (current / baseline), scope: ${SCAN_DIRS.join(" + ")} excluding ${EXCLUDE_DIRS.join(", ")}`);
  console.log(summary.join("\n"));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const allowedTotal = Object.values(baseline.counts).reduce((a, b) => a + b, 0);

  if (failed) {
    console.error("\nDesign-token check failed: the ratchet only turns one way.");
    process.exit(1);
  }

  if (total < allowedTotal) {
    console.log(
      `\n${allowedTotal - total} fewer than baseline. Re-run with --update to lock the gain in.`
    );
  }
  console.log(total === 0 ? "\nAll clear." : `\n${total} known violations left to clear.`);
}

main();
