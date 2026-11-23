import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

// Svaralternativene skal ikke røpe fasiten gjennom formen. Testene under fanger de vanligste
// signalene: at riktig svar er lengst (eller mer detaljert), og at påstander med «alltid»,
// «aldri», «kun» osv. nesten alltid er gale. Se «Skrive gode svaralternativer» i README.

interface Alt {
  tekst: string;
  riktig?: boolean;
}
interface Rå {
  id: string;
  niva: string;
  type: string;
  sporsmal: string;
  riktig?: boolean;
  alternativer?: Alt[];
}

// Leser YAML-kildene direkte, siden de genererte filene har ferdig satt LaTeX/HTML.
const kilder = import.meta.glob<string>("../../content/oppgaver/*.yaml", { query: "?raw", import: "default", eager: true });
const alle: Rå[] = Object.values(kilder).flatMap((tekst) => load(tekst) as Rå[]);

// Omtrentlig synlig lengde: LaTeX-kommandoer teller som ett tegn, markdown-tegn teller ikke.
const lengde = (s: string) =>
  s.replace(/\\[a-zA-Z]+/g, "x").replace(/[`*${}]/g, "").replace(/\s+/g, " ").trim().length;
const snitt = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const ABSOLUTT = /\b(alltid|aldri|kun|bare|garanter\w*|umulig|ingen|alle|helt|fullstendig|nødvendigvis|uansett|eneste)\b/i;

const enkelt = alle.filter((o) => o.type === "enkeltvalg");
const fler = alle.filter((o) => o.type === "flervalg");
const pastander = alle.filter((o) => o.type === "pastand");

function enkeltMål(o: Rå) {
  const L = o.alternativer!.map((a) => lengde(a.tekst));
  const ri = o.alternativer!.findIndex((a) => a.riktig);
  const feil = L.filter((_, i) => i !== ri);
  return { riktig: L[ri], lengst: L[ri] > Math.max(...feil), forhold: L[ri] / snitt(feil) };
}

describe("formskjevhet i enkeltvalg", () => {
  it("riktig svar er ikke oftere det lengste enn tilfeldig, heller ikke innen hvert nivå", () => {
    for (const niva of ["grunnleggende", "middels", "avansert", null]) {
      const x = enkelt.filter((o) => niva === null || o.niva === niva).map(enkeltMål);
      const andel = x.filter((m) => m.lengst).length / x.length;
      expect(andel, `andel der riktig er lengst (${niva ?? "alle"})`).toBeLessThanOrEqual(0.4);
    }
  });
  it("riktig svar er i snitt omtrent like langt som feilalternativene", () => {
    const forhold = snitt(enkelt.map((o) => enkeltMål(o).forhold));
    expect(forhold).toBeGreaterThan(0.8);
    expect(forhold).toBeLessThan(1.2);
  });
  it("ingen enkeltoppgave har et riktig svar som er mye lengre enn feilalternativene", () => {
    for (const o of enkelt) {
      const m = enkeltMål(o);
      if (m.riktig >= 10) expect(m.forhold, o.id).toBeLessThanOrEqual(2.5);
    }
  });
});

describe("formskjevhet i flervalg", () => {
  it("riktige alternativer er i snitt omtrent like lange som de gale", () => {
    const forhold = snitt(
      fler.map((o) => {
        const r = o.alternativer!.filter((a) => a.riktig).map((a) => lengde(a.tekst));
        const g = o.alternativer!.filter((a) => !a.riktig).map((a) => lengde(a.tekst));
        return g.length ? snitt(r) / snitt(g) : 1;
      })
    );
    expect(forhold).toBeGreaterThan(0.8);
    expect(forhold).toBeLessThan(1.25);
  });
});

describe("påstander", () => {
  it("er omtrent halvt sanne og halvt gale", () => {
    const sanne = pastander.filter((o) => o.riktig).length / pastander.length;
    expect(sanne).toBeGreaterThanOrEqual(0.4);
    expect(sanne).toBeLessThanOrEqual(0.6);
  });
  it("absolutte ord som «alltid» og «aldri» avslører ikke svaret", () => {
    const abs = pastander.filter((o) => ABSOLUTT.test(o.sporsmal));
    const gale = abs.filter((o) => !o.riktig).length / abs.length;
    expect(abs.length).toBeGreaterThanOrEqual(5);
    expect(gale).toBeLessThanOrEqual(0.7);
  });
});
