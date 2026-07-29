// One-off generator, run manually (`node scripts/generate-app-icons.mjs`) — not
// part of the build. Rasterizes the exact top-bar mark (lucide-react's
// Dumbbell path, teal-700 background per globals.css) to real PNG files, so
// the favicon, the iOS "Add to Home Screen" icon, and the Android/PWA
// manifest icons all show the same mark the app itself uses in the header.
import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PRIMARY = "#0f766e"; // teal-700, src/app/globals.css --primary

// Exact path data from node_modules/lucide-react/dist/esm/icons/dumbbell.mjs
const DUMBBELL_PATHS = [
  "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",
  "m2.5 21.5 1.4-1.4",
  "m20.1 3.9 1.4-1.4",
  "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",
  "m9.6 14.4 4.8-4.8",
];

function svg({ size, padding, radius }) {
  // No nested <svg> — a second viewport broke stroke inheritance under
  // sharp/resvg and rendered as a blank white square. A single flat
  // transform (translate + scale) on the source 24x24 path coordinates
  // avoids establishing a second rendering context altogether.
  const inner = size - padding * 2;
  const d = DUMBBELL_PATHS.map((p) => `<path d="${p}"/>`).join("");
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${PRIMARY}"/>
  <g transform="translate(${padding},${padding}) scale(${inner / 24})" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${d}
  </g>
</svg>`.trim();
}

async function render(outPath, opts) {
  const buf = Buffer.from(svg(opts));
  await sharp(buf).png().toFile(outPath);
  console.log("wrote", path.relative(ROOT, outPath), `${opts.size}x${opts.size}`);
}

async function main() {
  const appDir = path.join(ROOT, "src/app");
  const publicDir = path.join(ROOT, "public");
  mkdirSync(publicDir, { recursive: true });

  // Browser favicon — rounded square, matches the in-app top-bar treatment.
  await render(path.join(appDir, "icon.png"), { size: 32, padding: 5, radius: 7 });

  // iOS "Add to Home Screen" — Apple applies its own corner mask, so this
  // must be a full-bleed square with no radius/transparency of its own.
  await render(path.join(appDir, "apple-icon.png"), { size: 180, padding: 28, radius: 0 });

  // PWA / Android manifest icons — referenced explicitly from manifest.ts.
  await render(path.join(publicDir, "icon-192.png"), { size: 192, padding: 30, radius: 40 });
  await render(path.join(publicDir, "icon-512.png"), { size: 512, padding: 80, radius: 104 });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
