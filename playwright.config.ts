// Must match the app's env precedence (.env.local over .env). The webServer
// below is `next dev`, which reads .env.local; if this process resolved a
// different DATABASE_URL, the spec's afterAll cleanup would target one
// database while the app under test wrote to the other, orphaning the
// throwaway profile and its sessions in whichever one the app used.
import "./scripts/load-env";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
