import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 }, colorScheme: process.env.SCHEME ?? "light" });
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push(String(e)));
for (const d of process.argv.slice(2)) {
  await page.goto("http://localhost:4173/#/pensum/" + d, { waitUntil: "networkidle" });
  await page.waitForSelector("figure.figur .plot, figure.figur .diagram-svg", { timeout: 8000 }).catch(() => errs.push("ingen figur i " + d));
  await page.waitForTimeout(300);
  const fig = page.locator("figure.figur").first();
  await fig.scrollIntoViewIfNeeded();
  await fig.screenshot({ path: `/tmp/shots/fig_${d}.png` });
  console.log(d, "ok");
}
console.log(errs.length ? "FEIL: " + errs.join(" | ") : "ingen konsollfeil");
await browser.close();
