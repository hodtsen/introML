import { describe, expect, it } from "vitest";
import { ALLE_DELKAPITLER, KAPITLER, OPPGAVER } from "../../src/data/innhold";
import kode from "../../src/generated/kode.json";
import type { KodeData } from "../../src/types";

const data = kode as KodeData;
const alleKort = data.temaer.flatMap((t) => t.kort);

describe("Kode-fanen", () => {
  it("har en oversikt og kodekort for kapittel 1–8", () => {
    expect(data.oversiktHtml).toContain("Hvordan kode testes på eksamen");
    expect(data.temaer.map((t) => t.kap)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const t of data.temaer) expect(t.kort.length, `kapittel ${t.kap}`).toBeGreaterThanOrEqual(3);
  });
  it("har kode, forklaring og fallgruver i hvert kort", () => {
    for (const k of alleKort) {
      expect(k.kodeHtml, k.slug).toContain("<pre><code");
      expect(k.kodeHtml, k.slug).toContain("hljs-");
      expect(k.forklaringHtml.length, k.slug).toBeGreaterThan(100);
      expect((k.fallgruverHtml.match(/<li>/g) ?? []).length, k.slug).toBeGreaterThanOrEqual(2);
    }
  });
  it("holder kodesnuttene korte", () => {
    for (const k of alleKort) {
      const linjer = (k.kodeHtml.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/)?.[1] ?? "").trim().split("\n").length;
      expect(linjer, k.slug).toBeLessThanOrEqual(16);
    }
  });
  it("peker bare på delkapitler som finnes, og kortet ligger i riktig kapittel", () => {
    const deler = new Set(ALLE_DELKAPITLER.map((d) => d.nr));
    for (const t of data.temaer) {
      expect(KAPITLER.some((k) => k.nr === t.kap)).toBe(true);
      for (const k of t.kort) {
        expect(k.deler.length, k.slug).toBeGreaterThan(0);
        for (const d of k.deler) expect(deler.has(d), `${k.slug}: ${d}`).toBe(true);
      }
    }
    expect(new Set(alleKort.map((k) => k.slug)).size).toBe(alleKort.length);
  });
  it("har kodeoppgaver til kodequizen i hvert kapittel med kodekort", () => {
    const kodeoppgaver = OPPGAVER.filter((o) => o.tags.includes("kode"));
    expect(kodeoppgaver.length).toBeGreaterThanOrEqual(60);
    for (const t of data.temaer) expect(kodeoppgaver.filter((o) => o.kap === t.kap).length, `kapittel ${t.kap}`).toBeGreaterThanOrEqual(4);
  });
});
