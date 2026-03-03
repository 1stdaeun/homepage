import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30100,
  retries: 0,
  use: {
    baseURL: "http://localhost:3010",
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "npx vite --port 3010",
    port: 3010,
    reuseExistingServer: true,
    timeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
