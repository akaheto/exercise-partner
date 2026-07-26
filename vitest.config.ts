import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" alias from tsconfig.json natively (Vite 7+).
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // e2e specs are driven by Playwright, not Vitest.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
