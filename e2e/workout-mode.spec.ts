import "dotenv/config";
import { test, expect } from "@playwright/test";
import postgres from "postgres";

/**
 * Full run-through of Workout Mode (Epic H) against a real dev server and
 * database — the flow judged most worth end-to-end coverage, per
 * PROJECT_PLAN.docx H6. Runs serially: login, create a throwaway profile,
 * build a two-set workout, run it (including a real page reload to prove
 * resume is derived from the database, not client state), finish it, then
 * start a second session and abandon it. The profile is deleted afterwards
 * so this never leaves data behind in the dev database.
 */

const PROFILE_NAME = `E2E Runner ${Date.now()}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from profiles where display_name = ${PROFILE_NAME}`;
  await sql.end();
});

test("build a workout, run it with resume, finish it, then abandon a second session", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");

  // /profile became the admin-only all-profiles view in Epic P4 (2 Sept
  // 2026); a plain site-session holder can no longer reach its "Add a
  // profile" form there. The header's profile switcher is the one creation
  // path that stays reachable regardless of admin status or which profile
  // (if any) is already active.
  await page.getByRole("button", { name: "Switch profile" }).click();
  const switcherDialog = page.getByRole("dialog");
  await switcherDialog.getByLabel("Name").fill(PROFILE_NAME);
  await switcherDialog.getByLabel("PIN").fill("1234");
  await switcherDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(PROFILE_NAME).first()).toBeVisible();

  await page.goto("/build");
  await page.getByRole("button", { name: "Start building" }).click();
  await expect(page).toHaveURL(/\/workouts\/.+\/edit/);

  await page.getByRole("button", { name: "Add exercise" }).click();
  await page.getByPlaceholder("Search exercises…").fill("Knee Push-Up");
  await page.getByText("Knee Push-Up", { exact: true }).click();

  await page.getByLabel("Sets").fill("2");
  await page.getByLabel("Rest (s)").fill("1");
  // A real click elsewhere (not .blur(), which doesn't reliably fire React's
  // synthetic onBlur) triggers the item row's autosave-on-blur, which is
  // fire-and-forget with no visible "saved" signal to wait on.
  await page.getByRole("heading", { name: "Muscles worked" }).click();
  await page.waitForTimeout(500);

  // Reload and re-read the fields to be certain the onBlur autosave landed
  // before starting the session — a session snapshots the workout as it is
  // at that instant, so a race here would silently test the wrong numbers.
  await page.reload();
  await expect(page.getByLabel("Sets")).toHaveValue("2");
  await expect(page.getByLabel("Rest (s)")).toHaveValue("1");

  await page.getByRole("button", { name: "Start workout" }).click();
  await expect(page).toHaveURL(/\/session\/.+/);

  await expect(page.getByText("Set 1 of 2")).toBeVisible();
  // Weight and Reps are tap-to-cycle buttons (WeightToggle/RepToggle in
  // rep-weight-toggle.tsx), not fillable inputs or a NumberStepper +/- pair —
  // that design predates the current session-runner.tsx and this spec was
  // never updated to match, so it silently broke without anyone noticing
  // until a full e2e run was done again (PROJECT_PLAN.docx section 4, K4).
  // One tap each is enough: the resume assertion below only needs SOME
  // logged value to persist correctly, not a specific number.
  await page.getByRole("button", { name: /^Weight:/ }).click();
  await page.getByRole("button", { name: /^Reps:/ }).click();
  await page.getByRole("button", { name: "Log set 1" }).click();

  // Resume: reload immediately, before the 1s rest timer would naturally
  // clear — progress must come from the logged set in the database, not any
  // client-side state that a reload would wipe out.
  await page.reload();
  await expect(page.getByText("Set 2 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo last set" })).toBeVisible();

  await page.getByRole("button", { name: /^Weight:/ }).click();
  await page.getByRole("button", { name: /^Reps:/ }).click();
  await page.getByRole("button", { name: "Log set 2" }).click();

  await expect(page.getByText("All sets logged")).toBeVisible();
  await page.getByRole("button", { name: "Finish workout" }).click();
  await expect(page.getByText("Workout complete")).toBeVisible();
  await page.getByRole("link", { name: "Back to workouts" }).click();
  await expect(page).toHaveURL("/workouts");

  // Second session: start again, then abandon via the exit-confirm dialog.
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/session\/.+/);
  await page.getByRole("button", { name: "End workout" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("End this workout?")).toBeVisible();
  await dialog.getByRole("button", { name: "End workout" }).click();
  await expect(page).toHaveURL("/workouts");
});
