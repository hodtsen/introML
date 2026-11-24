import { expect, test } from "@playwright/test";
import { fangFeil } from "./hjelp";

test.describe("Kode-fanen", () => {
  test("oversikten har quiz, eksamensformat og register over kortene", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/");
    await page.getByRole("navigation", { name: "Hovedmeny" }).getByRole("link", { name: "Kode" }).click();
    await expect(page.locator("h1")).toHaveText("Kode");
    await expect(page.getByRole("heading", { name: "Kodequiz", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hvordan kode testes på eksamen" })).toBeVisible();
    await expect(page.locator(".kode-register li")).toHaveCount(41);
    expect(feil).toEqual([]);
  });

  test("et kapittel viser kodekort med utheving, forklaring og fallgruver", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/kode");
    await page.getByRole("tab", { name: /^1/ }).click();
    await expect(page).toHaveURL(/tema=1/);
    const kort = page.locator(".kodekort").filter({ hasText: "Binær og vektet cross-entropy i NumPy" });
    await expect(kort.locator("pre .hljs-keyword").first()).toBeVisible();
    await expect(kort.locator(".kodekort-fallgruver li").first()).toBeVisible();
    await expect(kort.locator(".katex").first()).toBeVisible();
    await kort.getByRole("link", { name: /1\.3/ }).click();
    await expect(page).toHaveURL(/pensum\/1\.3/);
    expect(feil).toEqual([]);
  });

  test("hoppe til et kort fra registeret", async ({ page }) => {
    await page.goto("#/kode");
    await page.locator(".kode-register").getByRole("button", { name: "DBSCAN" }).click();
    await expect(page).toHaveURL(/tema=6/);
    await expect(page.locator("#kort-dbscan")).toBeInViewport();
  });

  test("kodequiz for ett kapittel, med fasit og vei tilbake", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/kode?tema=7");
    await page.getByRole("link", { name: "Start kodequizen" }).click();
    await expect(page).toHaveURL(/kode\/quiz\?kap=7/);
    await expect(page.locator(".brodsmuler")).toContainText("Kodequiz, kapittel 7");
    const antall = await page.locator(".okt-prikk").count();
    expect(antall).toBeGreaterThanOrEqual(4);
    await page.locator(".alternativ-knapp").first().click();
    await page.getByRole("button", { name: "Sjekk svar" }).click();
    await expect(page.locator(".fasit")).toBeVisible();
    await page.locator(".brodsmuler").getByRole("link", { name: "Kode" }).click();
    await expect(page).toHaveURL(/#\/kode\?tema=7/);
    expect(feil).toEqual([]);
  });
});
