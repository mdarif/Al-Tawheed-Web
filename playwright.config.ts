import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Single preview server — run sequentially for reliability
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4322",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Always build fresh so tests run against the real production artifact.
    // Port 4322 avoids conflicts with `astro dev` on 4321.
    command: "npm run build && npx astro preview --port 4322",
    url: "http://localhost:4322",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
