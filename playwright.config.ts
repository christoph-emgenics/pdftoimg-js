import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  timeout: 60000,
  use: {
    browserName: "chromium",
    headless: true,
  },
});
