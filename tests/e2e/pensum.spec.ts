import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fangFeil } from "./hjelp";

const pensum: { nr: number; delkapitler: { nr: string; tittel: string }[] }[] = JSON.parse(
  readFileSync(new URL("../../src/generated/pensum-indeks.json", import.meta.url), "utf8")
);
const delkapitler = pensum.flatMap((k) => k.delkapitler.map((d) => ({ ...d, kap: k.nr })));

test.describe("pensum", () => {
  test("startsiden viser mestringskart med alle 58 delkapitler", async ({ page }) => {
    const feil = fangFeil(page);
    await page.goto("#/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduksjon til maskinlæring");
    await expect(page.locator(".mk-celle")).toHaveCount(58);
    expect(feil).toEqual([]);
  });

  test("alle 58 delkapitler kan åpnes og har sju seksjoner med formler", async ({ page }) => {
    test.setTimeout(240_000);
    const feil = fangFeil(page);
    for (const d of delkapitler) {
      await page.goto(`#/pensum/${d.nr}`);
      await expect(page.locator("h1")).toContainText(d.tittel);
      await expect(page.locator("section.seksjon")).toHaveCount(7);
      await expect(page.locator("#s-oppsummering")).toBeVisible();
    }
    expect(feil).toEqual([]);
  });

  test("formler vises med KaTeX", async ({ page }) => {
    await page.goto("#/pensum/1.3");
    await expect(page.locator(".katex").first()).toBeVisible();
    expect(await page.locator(".katex").count()).toBeGreaterThan(10);
    await expect(page.locator(".katex-error")).toHaveCount(0);
  });

  test("alle interaktive figurer laster", async ({ page }) => {
    const feil = fangFeil(page);
    for (const d of ["1.2", "1.4", "1.6", "2.5", "3.5", "4.5", "5.2", "5.3", "6.1", "6.5", "7.1", "7.5", "8.3", "9.4"]) {
      await page.goto(`#/pensum/${d}`);
      await expect(page.locator("figure.figur").first()).toBeVisible();
      await expect(page.locator(".figur-mangler")).toHaveCount(0);
      await expect(page.locator(".figur-laster")).toHaveCount(0);
    }
    expect(feil).toEqual([]);
  });

  test("figurene reagerer på kontrollene", async ({ page }) => {
    await page.goto("#/pensum/1.4");
    const fig = page.locator("figure.figur").first();
    await fig.getByRole("button", { name: "Ti steg" }).click();
    await expect(fig.locator(".figur-verdier")).toContainText("Steg 10");
    await page.goto("#/pensum/6.1");
    const km = page.locator("figure.figur").first();
    await km.getByRole("button", { name: "Kjør til konvergens" }).click();
    await expect(km).toContainText("Konvergert");
    await page.goto("#/pensum/8.3");
    const sh = page.locator("figure.figur").first();
    await sh.getByRole("button", { name: /katter og mus/i }).click();
    await expect(sh.locator(".figur-verdier")).toContainText("Effektivitet");
  });

  test("navigasjon med forrige/neste og brødsmuler", async ({ page }) => {
    await page.goto("#/pensum/1.1");
    await page.locator(".fn-neste").click();
    await expect(page).toHaveURL(/#\/pensum\/1\.2$/);
    await page.locator(".brodsmuler a", { hasText: "Kapittel 1" }).click();
    await expect(page).toHaveURL(/kapittel-1$/);
    await expect(page.locator(".dk-rad")).toHaveCount(7);
  });

  test("marker som lest lagres og vises på startsiden", async ({ page }) => {
    await page.goto("#/pensum/2.1");
    await page.getByRole("button", { name: "Marker som lest" }).first().click();
    await expect(page.getByRole("button", { name: "Lest", exact: true })).toBeVisible();
    await page.goto("#/");
    await expect(page.locator(".hjem-tall")).toContainText("1 av 58 delkapitler lest");
  });

  test("søk finner begreper og delkapitler", async ({ page }) => {
    await page.goto("#/");
    await expect(page.locator(".mk-celle").first()).toBeVisible();
    await page.keyboard.press("Control+k");
    await page.getByLabel("Søkeord").fill("bellman");
    await expect(page.locator(".sok-treff").first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/pensum\/7\.\d/);
  });

  test("formelark og begrepsliste", async ({ page }) => {
    await page.goto("#/formelark?kap=6");
    await expect(page.locator(".formelark-del")).toHaveCount(7);
    await page.goto("#/begreper");
    await expect(page.locator(".begrep").first()).toBeVisible();
    expect(await page.locator(".begrep").count()).toBeGreaterThan(300);
    await page.getByPlaceholder(/Filtrer/).fill("gini");
    await expect(page.locator(".begrep").first()).toContainText(/gini/i);
    expect(await page.locator(".begrep").count()).toBeLessThan(10);
  });
});
