import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 60000, // Aumentato a 60s per gestire i tempi di compilazione a freddo di Next.js in dev mode
  testDir: "./src/tests/e2e",
  fullyParallel: false, // Disabilita parallelo per evitare race condition sul DB condiviso locale
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Usa 1 worker per test sequenziali sul database locale di sviluppo
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
