import { db } from "../src/db/client";
import { exerciseOverrides } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fix instruction formatting: combine separated step numbers with their content.
 * Before: ["1.", "Grab two dumbbells...", "2.", "Slowly raise..."]
 * After: ["1. Grab two dumbbells...", "2. Slowly raise..."]
 */

function formatInstructions(text: string): string {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  const steps: string[] = [];
  let currentStep = "";

  for (const line of lines) {
    // Check if line is just a step number (e.g., "1.", "2.", "3.")
    if (/^\d+\.$/.test(line)) {
      if (currentStep) steps.push(currentStep);
      currentStep = line;
    } else if (currentStep && /^\d+\.$/.test(currentStep)) {
      // Append content to the current step number
      currentStep += " " + line;
    } else if (currentStep) {
      // Continuation of previous step
      currentStep += " " + line;
    } else {
      // No step number yet, just collect
      currentStep = line;
    }
  }

  if (currentStep) steps.push(currentStep);

  return steps.join("\n");
}

async function main() {
  console.log("Fixing instruction formatting for all exercises...");

  // Get all instruction overrides
  const allInstructions = await db
    .select()
    .from(exerciseOverrides)
    .where(eq(exerciseOverrides.field, "instructions"));

  console.log(`Found ${allInstructions.length} instruction overrides to process`);

  let fixed = 0;
  let unchanged = 0;

  for (const override of allInstructions) {
    const formatted = formatInstructions(override.value);

    if (formatted !== override.value) {
      // Update the override
      await db
        .update(exerciseOverrides)
        .set({ value: formatted, updatedAt: new Date() })
        .where(eq(exerciseOverrides.id, override.id));

      fixed++;
      if (fixed % 50 === 0) {
        console.log(`  ${fixed}/${allInstructions.length} fixed...`);
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Complete:`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Already formatted: ${unchanged}`);
  console.log(`  Total: ${allInstructions.length}`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
