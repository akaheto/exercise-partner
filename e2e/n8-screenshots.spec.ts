import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Visual pass over the Epic N8 surfaces: the login form, the home profile
 * selector, and all four onboarding steps.
 *
 * Walks the onboarding flow for real rather than rendering the steps in
 * isolation, since the bugs worth catching here are the ones that only appear
 * once a step is inside the flow's card and progress rail. Creates its own
 * profile and asserts the cleanup removed it.
 */

const PROFILE_NAME = `N8 Visual ${Date.now()}`;
const SHOTS = "test-results/n8";

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from profiles where display_name = ${PROFILE_NAME}`;
  const left = await sql`select count(*)::int as n from profiles where display_name = ${PROFILE_NAME}`;
  await sql.end();
  if (left[0].n !== 0) throw new Error("cleanup failed — throwaway profile still present");
});

/** The app selects its theme with a `dark` class on <html>, not a data
 * attribute — see the note in n7-screenshots.spec.ts. */
async function shoot(page: Page, name: string) {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((t) => {
      document.documentElement.classList.toggle("dark", t === "dark");
    }, theme);
    for (const [label, width] of [["desktop", 1280], ["mobile", 375]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${SHOTS}/${name}-${theme}-${label}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

test("login, home and the onboarding flow render at both widths in both themes", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByLabel("Password")).toBeVisible();
  await shoot(page, "login");

  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");

  // A fresh browser context has no active_profile_id, so home shows the
  // selector rather than redirecting to /exercises.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Exercise Partner" })).toBeVisible();
  await shoot(page, "home");

  // Empty-search state of the profile grid.
  const search = page.getByLabel("Search profiles");
  if (await search.isVisible()) {
    await search.fill("zzzz-no-such-profile");
    await expect(page.getByText("No profiles match that search")).toBeVisible();
    await shoot(page, "home-no-results");
    await search.fill("");
  }

  await page.goto("/onboarding");
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await shoot(page, "onboarding-1");

  await page.getByLabel("What's your name?").fill(PROFILE_NAME);
  await page.getByLabel("Choose a PIN").fill("1234");
  await page.getByRole("button", { name: /next: your experience level/i }).click();

  // Fixed via onboarding_completed_at (PROJECT_PLAN.docx section 4, item 47
  // — resolved): /onboarding used to redirect the instant step 1 created a
  // profile, since experience_level/training_goal default to Beginner/
  // General and can't distinguish "chose Beginner" from "never asked". Steps
  // 2-4 are real now, so this proceeds rather than skipping.
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await shoot(page, "onboarding-2");

  await page.getByRole("button", { name: /Intermediate/ }).click();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await shoot(page, "onboarding-3");

  await page.getByRole("button", { name: /Hypertrophy/ }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await expect(page.getByText("You're all set")).toBeVisible();
  await shoot(page, "onboarding-4");

  await page.getByRole("button", { name: /start using exercise partner/i }).click();
  await expect(page).toHaveURL("/exercises");

  // The real proof, not just that the button navigated: level and goal used
  // to live only in this component's React state and were never written to
  // the database at all, a second bug entirely masked by the redirect bug.
  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`
    select experience_level, training_goal, onboarding_completed_at
    from profiles where display_name = ${PROFILE_NAME}
  `;
  await sql.end();
  expect(row.experience_level).toBe("Intermediate");
  expect(row.training_goal).toBe("Hypertrophy");
  expect(row.onboarding_completed_at).not.toBeNull();
});
