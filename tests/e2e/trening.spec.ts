import { expect, test } from "@playwright/test";
import { fangFeil } from "./hjelp";

test.describe("eksamenstrening", () => {
  test("alle oppgavetyper kan besvares og gir fasit", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/trening/okt?del=1.5");
    const kort = page.locator("article.oppgave");
    const sett = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const klasse = (await kort.getAttribute("class")) ?? "";
      const type = klasse.match(/oppgave-(enkeltvalg|flervalg|pastand|tall|tekst)/)![1];
      sett.add(type);
      if (type === "enkeltvalg" || type === "flervalg") {
        await expect(kort.getByRole("button", { name: "Sjekk svar" })).toBeDisabled();
        await kort.locator(".alternativ-knapp").first().click();
        await kort.getByRole("button", { name: "Sjekk svar" }).click();
        await expect(kort.locator(".alternativ-forklaring").first()).toBeVisible();
        await expect(kort.locator(".eksamenspoeng")).toBeVisible();
      } else if (type === "pastand") {
        await kort.getByRole("radio", { name: "Riktig" }).click();
        await kort.getByRole("button", { name: "Sjekk svar" }).click();
        await expect(kort.locator(".pastand-fasit")).toBeVisible();
      } else if (type === "tall") {
        const felt = kort.locator(".tallinput input");
        const n = await felt.count();
        for (let k = 0; k < n; k++) await felt.nth(k).fill("0,5");
        await kort.getByRole("button", { name: "Sjekk svar" }).click();
        await expect(kort.locator(".talldel-fasit").first()).toBeVisible();
      } else {
        await kort.locator("textarea").first().fill("Recall er viktigst fordi falske negative er farlige, og accuracy er misvisende ved ubalanse.");
        await kort.getByRole("button", { name: "Vurder svaret" }).click();
        await expect(kort.locator(".eksempelsvar")).toBeVisible();
        await kort.getByRole("button", { name: /Lagre vurderingen/ }).click();
      }
      await expect(kort.locator(".fasit")).toBeVisible();
      await expect(kort.locator(".husk")).toBeVisible();
      if (i < 5) await page.getByRole("button", { name: "Neste oppgave" }).click();
    }
    expect(sett.size).toBe(5);
    await page.getByRole("button", { name: /Avslutt og se oppsummering/ }).click();
    await expect(page.getByRole("heading", { name: "Økten er ferdig" })).toBeVisible();
    expect(feil).toEqual([]);
  });

  test("fasit vises ikke før man har svart eller bekreftet", async ({ page }) => {
    await page.goto("#/trening/okt?del=3.5");
    const kort = page.locator("article.oppgave");
    await expect(kort.locator(".fasit")).toHaveCount(0);
    await kort.getByRole("button", { name: "Vis fasit uten å svare" }).click();
    await expect(kort.locator(".fasit")).toHaveCount(0);
    await kort.getByRole("button", { name: "Ja, vis fasit" }).click();
    await expect(kort.locator(".fasit")).toBeVisible();
  });

  test("blandet øving og repetisjon av feil", async ({ page }) => {
    await page.goto("#/trening");
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /^Start \d+ oppgaver$/ }).click();
    await expect(page.locator(".okt-prikk")).toHaveCount(5);
    const kort = page.locator("article.oppgave");
    // Svar garantert feil på den første regneoppgaven (1.1-03) ved å skrive inn et urimelig tall
    await page.goto("#/trening/okt?modus=tag&tag=regning");
    const felt = kort.locator(".tallinput input");
    await expect(felt.first()).toBeVisible();
    const n = await felt.count();
    for (let k = 0; k < n; k++) await felt.nth(k).fill("999");
    await kort.getByRole("button", { name: "Sjekk svar" }).click();
    await page.goto("#/trening");
    await expect(page.getByRole("link", { name: /Repeter \d+ oppgaver/ })).toBeVisible();
  });

  test("kode- og figuroppgaver kan øves samlet", async ({ page }) => {
    await page.goto("#/trening");
    await page.getByRole("link", { name: /\d+ kodeoppgaver/ }).click();
    await expect(page.getByRole("navigation", { name: "Brødsmulesti" })).toContainText("Kodeoppgaver");
    await expect(page.locator("article.oppgave pre code").first()).toBeVisible();
    await page.goto("#/trening/okt?modus=tag&tag=figur");
    await expect(page.getByRole("navigation", { name: "Brødsmulesti" })).toContainText("Figurer og tabeller");
    await expect(page.locator("article.oppgave .oppgavefigur, article.oppgave table").first()).toBeVisible();
  });

  test("tema-listen åpner delkapitler", async ({ page }) => {
    await page.goto("#/trening");
    await page.locator(".tema-veksle").first().click();
    await page.locator(".tema-deler a").first().click();
    await expect(page).toHaveURL(/okt\?del=1\.1/);
    await expect(page.locator("article.oppgave")).toBeVisible();
  });
});
