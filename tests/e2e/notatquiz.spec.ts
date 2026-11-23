import { expect, test } from "@playwright/test";
import { fangFeil } from "./hjelp";

test.describe("notatquiz", () => {
  test("oversikten viser begge quizene og fanen i menyen", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/");
    await page.getByRole("navigation", { name: "Hovedmeny" }).getByRole("link", { name: "Notatquiz" }).click();
    await expect(page.locator("h1")).toHaveText("Notatquiz");
    await expect(page.getByRole("heading", { name: "Oppgavene i forelesningsnotatene" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Eksempler på eksamensspørsmål" })).toBeVisible();
    await expect(page.locator(".notatquiz-sett").first()).toContainText("85 oppgaver");
    await expect(page.locator(".notatquiz-sett").nth(1)).toContainText("10 oppgaver");
    expect(feil).toEqual([]);
  });

  test("svare på et eksamenseksempel og få fasit med kilde", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/notatquiz/eksempler");
    await expect(page.locator(".okt-prikk")).toHaveCount(10);
    await expect(page.locator(".oppgave-kilde")).toContainText("Fra forelesningsnotatene");
    await expect(page.locator(".oppgave-sporsmal")).toContainText("diagonalen");
    await page.locator(".alternativ-knapp").first().click();
    await page.getByRole("button", { name: "Sjekk svar" }).click();
    await expect(page.locator(".fasit")).toBeVisible();
    await expect(page.locator(".okt-fremdrift")).toContainText("1 av 10 besvart");
    expect(feil).toEqual([]);
  });

  test("filtrere notatoppgavene på ett kapittel", async ({ page }) => {
    await page.goto("#/notatquiz");
    await page.getByRole("link", { name: "6 AI Act" }).click();
    await expect(page.locator(".brodsmuler")).toContainText("kapittel 6: AI Act");
    await expect(page.locator(".okt-prikk")).toHaveCount(3);
  });
});
