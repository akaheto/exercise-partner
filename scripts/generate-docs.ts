/**
 * Regenerates the Word deliverables into the synced Drive project folder.
 *
 * Usage: npm run docs
 */
import { DOCS_DIR } from "./docs/shared";
import { generateProjectPlan } from "./docs/project-plan";
import { generateTechnicalSpec } from "./docs/technical-spec";
import { generateVisualStyleGuide } from "./docs/visual-style-guide";
import { generateUserGuide } from "./docs/user-guide";
import { generateEnhancements } from "./docs/enhancements";

const generators = [
  generateProjectPlan,
  generateTechnicalSpec,
  generateVisualStyleGuide,
  generateUserGuide,
  generateEnhancements,
];

async function main() {
  console.log(`Writing Word deliverables to:\n  ${DOCS_DIR}\n`);

  const results = await Promise.allSettled(generators.map((generate) => generate()));

  let failed = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`  ✓ ${result.value.split("/").pop()}`);
    } else {
      failed += 1;
      console.error(`  ✗ ${generators[i].name} failed: ${result.reason}`);
    }
  });

  if (failed > 0) {
    console.error(`\n${failed} document(s) failed to generate.`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nDone — ${results.length} document(s) written.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
