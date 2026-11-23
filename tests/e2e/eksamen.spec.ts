import { expect, test } from "@playwright/test";
import { fangFeil } from "./hjelp";

test.describe("eksamenssimulering", () => {
  test("gjennomføre, levere og få rapport", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/eksamen");
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "30 min" }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    await expect(page.locator(".klokke")).toContainText("igjen");
    await expect(page.locator(".nav-celle:not([aria-hidden])")).toHaveCount(10);

    // Svar på de fem første, flagg det tredje
    for (let i = 0; i < 5; i++) {
      await page.locator(".eksamen-sporsmal .alternativ-knapp").first().click();
      if (i === 2) await page.getByRole("button", { name: "Merk for gjennomgang" }).click();
      await page.getByRole("button", { name: "Neste", exact: true }).click();
    }
    await expect(page.locator(".eksamen-topp")).toContainText("5 av 10 besvart");

    // Eksamen overlever at siden lastes på nytt
    await page.reload();
    await expect(page.locator(".eksamen-topp")).toContainText("5 av 10 besvart");

    await page.getByRole("button", { name: "Lever", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("5 står blanke");
    await page.getByRole("button", { name: "Lever nå" }).click();
    await expect(page.locator(".resultat-hode h1")).toHaveText("Resultat");
    await expect(page.locator(".gj-post")).toHaveCount(10);
    await page.getByRole("button", { name: /Blanke \(5\)/ }).click();
    await expect(page.locator(".gj-post")).toHaveCount(5);
    await page.locator(".gj-hode").first().click();
    await expect(page.locator(".gj-innhold .alternativ-forklaring").first()).toBeVisible();
    expect(feil).toEqual([]);
  });

  test("Inspera-regelen: enkeltvalg kan byttes, men ikke gjøres blanke; flervalg kan krysses av og på", async ({ page }) => {
    await page.goto("#/eksamen");
    await page.getByRole("button", { name: "Uten tid" }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    const topp = page.locator(".eksamen-topp");
    const radio = page.locator(".eksamen-sporsmal [role=radio]");
    const avkrysning = page.locator(".eksamen-sporsmal [role=checkbox]");

    // Finn et enkeltvalg og et flervalg blant spørsmålene.
    await expect(page.locator(".nav-celle:not([aria-hidden])")).toHaveCount(40);
    const antall = 40;
    let enkelt = -1;
    let fler = -1;
    for (let k = 0; k < antall && (enkelt < 0 || fler < 0); k++) {
      await page.locator(".nav-celle:not([aria-hidden])").nth(k).click();
      await expect(page.locator("#spm-tittel")).toContainText(`Spørsmål ${k + 1} av`);
      const instruks = await page.locator(".eksamen-sporsmal .instruks").textContent();
      if (enkelt < 0 && instruks === "Velg ett alternativ.") enkelt = k;
      if (fler < 0 && instruks?.startsWith("Velg ett eller flere")) fler = k;
    }
    expect(enkelt).toBeGreaterThanOrEqual(0);
    expect(fler).toBeGreaterThanOrEqual(0);

    // Enkeltvalg: bytte går, blankt går ikke.
    await page.locator(".nav-celle:not([aria-hidden])").nth(enkelt).click();
    await radio.nth(0).click();
    await expect(topp).toContainText("1 av");
    await expect(page.getByRole("button", { name: "Fjern svaret" })).toHaveCount(0);
    await radio.nth(0).click();
    await expect(radio.nth(0)).toHaveAttribute("aria-checked", "true");
    await radio.nth(1).click();
    await expect(radio.nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(radio.nth(0)).toHaveAttribute("aria-checked", "false");
    await expect(topp).toContainText("1 av");

    // Flervalg: kryss kan settes og fjernes, helt til blankt.
    await page.locator(".nav-celle:not([aria-hidden])").nth(fler).click();
    await avkrysning.nth(0).click();
    await avkrysning.nth(1).click();
    await expect(topp).toContainText("2 av");
    await avkrysning.nth(0).click();
    await expect(avkrysning.nth(0)).toHaveAttribute("aria-checked", "false");
    await avkrysning.nth(1).click();
    await expect(avkrysning.nth(1)).toHaveAttribute("aria-checked", "false");
    await expect(topp).toContainText("1 av");
  });

  test("H25-modus gir ti grupper", async ({ page }) => {
    await page.goto("#/eksamen");
    await page.getByLabel(/Som eksamen 2025/).check();
    await page.getByRole("button", { name: "Uten tid" }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    await expect(page.locator(".nav-celle:not([aria-hidden])")).toHaveCount(40);
    await expect(page.locator(".eksamen-sporsmal header")).toContainText("gruppe 1");
  });

  test("eksamen leveres automatisk når tiden er ute", async ({ page }) => {
    await page.goto("#/eksamen");
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "30 min" }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    await expect(page.locator(".klokke")).toBeVisible();
    // Flytt fristen til fortiden i lagringen og last siden på nytt
    await page.evaluate(() => {
      const k = "tdt4172-eksamensportal-v1";
      const t = JSON.parse(localStorage.getItem(k)!);
      t.aktivEksamen.frist = Date.now() - 1000;
      localStorage.setItem(k, JSON.stringify(t));
    });
    await page.reload();
    await expect(page.locator(".resultat-hode")).toContainText("Levert automatisk");
  });

  test("fremgangssiden viser eksamenshistorikk og kan nullstilles", async ({ page }) => {
    await page.goto("#/eksamen");
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Uten tid" }).click();
    await page.getByRole("button", { name: "Start eksamen" }).click();
    await page.locator(".eksamen-sporsmal .alternativ-knapp").first().click();
    await page.getByRole("button", { name: "Lever", exact: true }).click();
    await page.getByRole("button", { name: "Lever nå" }).click();
    await page.goto("#/fremgang");
    await expect(page.locator(".fremgang")).toContainText("1 eksamenssimuleringer levert");
    await page.getByRole("button", { name: "Nullstill alt" }).click();
    await page.getByRole("button", { name: "Ja, slett" }).click();
    await expect(page.locator(".fremgang")).toContainText("0 eksamenssimuleringer levert");
  });
});
