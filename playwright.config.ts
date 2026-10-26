import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * End-to-end tests run against a production build with a separate SQLite file.
 *   npm run test:e2e        (builds first)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // One worker: desktop and mobile runs share one cold server; serial is faster and more stable.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx prisma migrate deploy && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/places?q=lon`,
    env: { DATABASE_URL: "file:./prisma/e2e.db", MAIL_PROVIDER: "mock" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
