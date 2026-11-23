import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import oppgaveIndeks from "../../src/generated/oppgave-indeks.json";

// Notatquizen samler oppgavene fra forelesningsnotatene (notater-*.yaml) og
// eksamenseksemplene fra notatenes siste kapittel (eksempler.yaml).

interface Alt {
  tekst: string;
  riktig?: boolean;
}
interface Rå {
  id: string;
  kilde?: string;
  type: string;
  alternativer?: Alt[];
}

const kilder = import.meta.glob<string>("../../content/notatquiz/*.yaml", { query: "?raw", import: "default", eager: true });
const filer = Object.entries(kilder).map(([sti, tekst]) => ({ sti, liste: load(tekst) as Rå[] }));
const notater = filer.filter((f) => /\/notater[^/]*\.yaml$/.test(f.sti)).flatMap((f) => f.liste);
const eksempler = filer.filter((f) => /\/eksempler\.yaml$/.test(f.sti)).flatMap((f) => f.liste);

const lengde = (s: string) =>
  s.replace(/\\[a-zA-Z]+/g, "x").replace(/[`*${}]/g, "").replace(/\s+/g, " ").trim().length;
const snitt = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;

describe("notatquiz", () => {
  it("har oppgaver fra alle sju kapitlene i notatene", () => {
    const kapitler = new Set(notater.map((o) => Number(o.kilde?.match(/^(\d+)/)?.[1])));
    expect([...kapitler].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(notater.length).toBeGreaterThanOrEqual(80);
  });

  it("har alle ti eksamenseksemplene", () => {
    expect(eksempler.map((o) => o.id)).toEqual(Array.from({ length: 10 }, (_, i) => `E${String(i + 1).padStart(2, "0")}`));
  });

  it("har unike id-er og kilde på hver oppgave", () => {
    const alle = [...notater, ...eksempler];
    expect(new Set(alle.map((o) => o.id)).size).toBe(alle.length);
    for (const o of alle) expect(o.kilde, o.id).toBeTruthy();
  });

  it("holdes utenfor oppgavebanken og eksamenssimuleringen", () => {
    const ider = new Set((oppgaveIndeks as { id: string }[]).map((o) => o.id));
    for (const o of [...notater, ...eksempler]) expect(ider.has(o.id), o.id).toBe(false);
  });

  it("røper ikke fasit gjennom lengden på alternativene", () => {
    // Eksamenseksemplene har alternativene fra notatene og holdes utenfor.
    const enkelt = notater.filter((o) => o.type === "enkeltvalg");
    const forhold = enkelt.map((o) => {
      const L = o.alternativer!.map((a) => lengde(a.tekst));
      const ri = o.alternativer!.findIndex((a) => a.riktig);
      const feil = L.filter((_, i) => i !== ri);
      return { id: o.id, riktig: L[ri], lengst: L[ri] > Math.max(...feil), forhold: L[ri] / snitt(feil) };
    });
    expect(forhold.filter((f) => f.lengst).length / forhold.length).toBeLessThanOrEqual(0.4);
    expect(snitt(forhold.map((f) => f.forhold))).toBeLessThanOrEqual(1.2);
    for (const f of forhold) if (f.riktig >= 10) expect(f.forhold, f.id).toBeLessThanOrEqual(2.5);
  });
});
