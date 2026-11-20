import { defineConfig, devices } from "@playwright/test";

// Ende-til-ende-tester mot det ferdige bygget (vite preview).
// Lokalt kan du peke på en installert Chrome med CHROME_PATH=/sti/til/chrome,
// ellers brukes Playwrights egen Chromium (npx playwright install chromium).
const executablePath = process.env.CHROME_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4174/",
    launchOptions: { executablePath, args: ["--no-sandbox"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } }, testIgnore: /mobil\.spec\.ts/ },
    { name: "mobil", use: { ...devices["Pixel 7"] }, testMatch: /mobil\.spec\.ts/ },
  ],
  webServer: {
    command: "npm run build && npx vite preview --port 4174 --strictPort",
    url: "http://localhost:4174/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
