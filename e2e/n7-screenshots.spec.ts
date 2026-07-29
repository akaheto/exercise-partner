import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Throwaway visual pass over the Epic N7 surfaces (/profile and /admin).
 *
 * Not an assertion suite — it exists so the design-system conversion gets the
 * same real-browser look every earlier phase got, at both the desktop and
 * 375px widths and in both themes. Phase 4 found two layout bugs this way that
 * no unit test caught.
 *
 * Creates its own profile and deletes it in afterAll. The admin table lists
 * every profile, so the owner's row is visible there; nothing is modified,
 * and nothing here confirms a deletion.
 */

const PROFILE_NAME = `N7 Visual ${Date.now()}`;
const SHOTS = "test-results/n7";

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`delete from profiles where display_name = ${PROFILE_NAME}`;
  const left = await sql`select count(*)::int as n from profiles where display_name = ${PROFILE_NAME}`;
  await sql.end();
  if (left[0].n !== 0) throw new Error("cleanup failed — throwaway profile still present");
});

/**
 * The app selects its theme with a `dark` class on <html>, applied before
 * hydration by NO_FLASH_THEME_SCRIPT — not a data-attribute and not the media
 * query alone. Toggling anything else silently leaves the page in whichever
 * theme it loaded in, which is how the first run of this spec produced twelve
 * screenshots all labelled with two themes and rendered in one.
 */
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await page.waitForTimeout(120);
}

async function shoot(page: Page, name: string) {
  for (const theme of ["light", "dark"] as const) {
    await setTheme(page, theme);
    for (const [label, width] of [["desktop", 1280], ["mobile", 375]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${SHOTS}/${name}-${theme}-${label}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

test("profile and admin surfaces render at both widths in both themes", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill(process.env.SITE_PASSWORD!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");

  // Own profile, so nothing below is the owner's data.
  await page.goto("/profile");
  await page.getByLabel("Name").fill(PROFILE_NAME);
  await page.getByLabel("PIN").fill("1234");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(PROFILE_NAME).first()).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByRole("radiogroup", { name: "Experience level" })).toBeVisible();
  await shoot(page, "profile");

  // The PIN confirm dialog, opened but never confirmed.
  await page.getByRole("button", { name: /delete this profile/i }).click();
  await expect(page.getByLabel(/enter your pin/i)).toBeVisible();
  await shoot(page, "profile-confirm");
  await page.keyboard.press("Escape");

  // The admin session cookie is an unsigned literal — setting it here is the
  // bypass recorded as PROJECT_PLAN section 4 item 36, and is the only reason
  // this spec can reach /admin without ADMIN_TOKEN being configured at all.
  await context.addCookies([
    {
      name: "admin_session",
      value: "authenticated",
      domain: "localhost",
      path: "/admin",
    },
  ]);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible();
  await shoot(page, "admin");

  await page.goto("/admin/login");
  await expect(page.getByText("Admin access")).toBeVisible();
  await shoot(page, "admin-login");
});
