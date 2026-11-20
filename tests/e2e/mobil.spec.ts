import { expect, test } from "@playwright/test";
import { fangFeil } from "./hjelp";

test.describe("mobil", () => {
  test("hovedmeny og sidemeny fungerer på smal skjerm", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/pensum/4.3");
    await expect(page.locator(".hovedmeny")).toBeHidden();
    await page.getByRole("button", { name: "Åpne menyen" }).click();
    await expect(page.locator(".hovedmeny")).toBeVisible();
    await page.getByRole("button", { name: "Lukk menyen" }).click();
    await page.getByRole("button", { name: "Kapitler og delkapitler" }).click();
    await expect(page.locator(".sidemeny.apen")).toBeVisible();
    await page.locator(".sidemeny .sm-deler a", { hasText: "Boosting og AdaBoost" }).click();
    await expect(page).toHaveURL(/#\/pensum\/4\.4$/);
    // Ingen horisontal scrolling av hele siden
    const bredde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(bredde).toBeLessThanOrEqual(1);
    expect(feil).toEqual([]);
  });

  test("oppgaver og eksamen kan brukes på mobil", async ({ page }) => {
    await page.goto("#/trening/okt?del=6.3");
    await page.locator("article.oppgave .alternativ-knapp").first().click();
    await page.getByRole("button", { name: "Sjekk svar" }).click();
    await expect(page.locator(".fasit")).toBeVisible();
    await page.goto("#/eksamen");
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    await expect(page.locator(".eksamen-sporsmal")).toBeVisible();
    const bredde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(bredde).toBeLessThanOrEqual(1);
  });
});
