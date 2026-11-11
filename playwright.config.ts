import { defineConfig } from "@playwright/test";
import fs from "node:fs";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 240000,
  expect: { timeout: 30000 },
  use: {
    actionTimeout: 30000,
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ||
        (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
