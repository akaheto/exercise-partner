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

  await page.goto("/profile");
  await page.getByLabel("Name").fill(PROFILE_NAME);
  // Profile creation gained a required PIN in 1396bd1, after this spec was
  // written; without it the form never submits and setup fails before
  // Workout Mode is ever reached.
  await page.getByLabel("PIN").fill("1234");
  await page.getByRole("button", { name: "Add" }).click();
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
  // `exact` because weight and reps are now steppers: the +/- buttons are
  // named "Increase Weight" / "Decrease Weight" for screen readers, so a
  // substring match on "Weight" would hit three controls.
  await page.getByLabel("Weight", { exact: true }).fill("20");
  await page.getByLabel("Reps", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Log set 1" }).click();

  // Resume: reload immediately, before the 1s rest timer would naturally
  // clear — progress must come from the logged set in the database, not any
  // client-side state that a reload would wipe out.
  await page.reload();
  await expect(page.getByText("Set 2 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo last set" })).toBeVisible();

  // Set 2 goes in through the steppers rather than the keyboard — the other
  // half of "steppers with large +/- targets alongside direct entry", and the
  // path a user takes mid-set without unlocking a keyboard.
  const increaseWeight = page.getByRole("button", { name: "Increase Weight" });
  await increaseWeight.click();
  await increaseWeight.click();
  await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("5");
  const increaseReps = page.getByRole("button", { name: "Increase Reps" });
  for (let i = 0; i < 10; i++) await increaseReps.click();
  await expect(page.getByLabel("Reps", { exact: true })).toHaveValue("10");
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
