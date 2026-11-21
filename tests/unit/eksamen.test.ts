import { describe, expect, it } from "vitest";
import { beregnResultat, eksamensPool, H25_GRUPPER, karakter, lagEksamen, lagRekkefolge, poengForSporsmal, STANDARD_OPPSETT, type AktivEksamen } from "../../src/lib/eksamen";
import { eksamenspoeng2026, scoreValg } from "../../src/lib/vurdering";
import type { Oppgave } from "../../src/types";

const alt = (riktige: number[], n = 4) =>
  Array.from({ length: n }, (_, i) => ({ html: String(i), riktig: riktige.includes(i), forklaringHtml: "" }));
const oppg = (id: string, type: "enkeltvalg" | "flervalg", riktige: number[], kap = 1, n = 4): Oppgave => ({
  id,
  del: `${kap}.1`,
  kap,
  niva: "middels",
  type,
  tags: [],
  sporsmalHtml: "",
  kort: "",
  huskHtml: "",
  alternativer: alt(riktige, n),
});

describe("poeng etter kunngjøringen for 2026", () => {
  it("enkeltvalg: +1, −1/(k−1), blankt 0", () => {
    const o = oppg("a", "enkeltvalg", [2]);
    expect(poengForSporsmal(o, [2], "2026")).toEqual({ poeng: 1, maks: 1 });
    expect(poengForSporsmal(o, [0], "2026").poeng).toBeCloseTo(-1 / 3);
    expect(poengForSporsmal(o, [], "2026")).toEqual({ poeng: 0, maks: 1 });
    expect(poengForSporsmal(oppg("b", "enkeltvalg", [0], 1, 5), [1], "2026").poeng).toBeCloseTo(-0.25);
  });
  it("flervalg: +1 per riktig kryss, −1 per feil kryss", () => {
    const o = oppg("c", "flervalg", [0, 2]);
    expect(poengForSporsmal(o, [0, 2], "2026")).toEqual({ poeng: 2, maks: 2 });
    expect(poengForSporsmal(o, [0], "2026")).toEqual({ poeng: 1, maks: 2 });
    expect(poengForSporsmal(o, [0, 1], "2026")).toEqual({ poeng: 0, maks: 2 });
    expect(poengForSporsmal(o, [1, 3], "2026")).toEqual({ poeng: -2, maks: 2 });
  });
  it("gjetting har forventning 0 for enkeltvalg", () => {
    const o = oppg("d", "enkeltvalg", [1]);
    const snitt = [0, 1, 2, 3].reduce((s, i) => s + poengForSporsmal(o, [i], "2026").poeng, 0) / 4;
    expect(snitt).toBeCloseTo(0);
  });
});

describe("poeng som eksamen 2025", () => {
  it("+2,5 for riktig og −0,83 for feil med fire alternativer", () => {
    const o = oppg("e", "enkeltvalg", [0]);
    expect(poengForSporsmal(o, [0], "H25").poeng).toBe(2.5);
    expect(poengForSporsmal(o, [1], "H25").poeng).toBeCloseTo(-0.8333, 3);
  });
  it("setter negative gruppesummer til 0", () => {
    const sp = ["g1", "g2", "g3", "g4", "h1", "h2", "h3", "h4"].map((id) => oppg(id, "enkeltvalg", [0]));
    const kart = new Map(sp.map((o) => [o.id, o]));
    const e: AktivEksamen = {
      id: "x",
      start: 0,
      frist: null,
      oppsett: { ...STANDARD_OPPSETT, modus: "H25" },
      sporsmal: sp.map((o, i) => ({ id: o.id, gruppe: i < 4 ? 0 : 1 })),
      rekkefolge: {},
      // Gruppe 0: alle fire feil (−3,33 → 0). Gruppe 1: alle riktige (10).
      svar: { g1: [1], g2: [1], g3: [1], g4: [1], h1: [0], h2: [0], h3: [0], h4: [0] },
      flagget: [],
      gjeldende: 0,
    };
    const r = beregnResultat(e, kart, false);
    expect(r.poeng).toBeCloseTo(10);
    expect(r.maks).toBe(20);
    expect(r.prosent).toBeCloseTo(0.5);
  });
});

describe("karakter", () => {
  it("følger NTNUs standardskala", () => {
    expect(karakter(0.9)).toBe("A");
    expect(karakter(0.89)).toBe("A");
    expect(karakter(0.88)).toBe("B");
    expect(karakter(0.77)).toBe("B");
    expect(karakter(0.65)).toBe("C");
    expect(karakter(0.53)).toBe("D");
    expect(karakter(0.41)).toBe("E");
    expect(karakter(0.4)).toBe("F");
  });
  it("bruker 2024-grensene når det bes om", () => {
    expect(karakter(0.9, true)).toBe("B");
    expect(karakter(0.8, true)).toBe("C");
  });
});

describe("øvingspoeng", () => {
  it("gir delpoeng for flervalg og 0 som minimum", () => {
    const o = oppg("f", "flervalg", [0, 2]);
    expect(scoreValg(o, [0])).toBe(0.5);
    expect(scoreValg(o, [0, 1])).toBe(0);
    expect(scoreValg(o, [1, 3])).toBe(0);
    expect(eksamenspoeng2026(o, [1, 3]).poeng).toBe(-2);
  });
});

describe("eksamenssett fra oppgavebanken", () => {
  it("har nok eksamenslike spørsmål", () => {
    expect(eksamensPool().length).toBeGreaterThanOrEqual(150);
  });
  it("lager 40 unike spørsmål fordelt på alle kapitler (2026)", () => {
    const sp = lagEksamen(STANDARD_OPPSETT, new Set());
    expect(sp).toHaveLength(40);
    expect(new Set(sp.map((s) => s.id)).size).toBe(40);
    const kap = new Set(sp.map((s) => Number(s.id.split(".")[0])));
    expect(kap.size).toBe(9);
  });
  it("gir samme faste sett hver gang", () => {
    const a = lagEksamen({ ...STANDARD_OPPSETT, sett: "A" }, new Set());
    const b = lagEksamen({ ...STANDARD_OPPSETT, sett: "A" }, new Set());
    const c = lagEksamen({ ...STANDARD_OPPSETT, sett: "B" }, new Set());
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
  it("lager 10 grupper med 4 enkeltvalg i H25-modus", () => {
    const sp = lagEksamen({ ...STANDARD_OPPSETT, modus: "H25" }, new Set());
    expect(sp).toHaveLength(40);
    for (let g = 0; g < H25_GRUPPER.length; g++) expect(sp.filter((s) => s.gruppe === g)).toHaveLength(4);
    expect(new Set(sp.map((s) => s.id)).size).toBe(40);
  });
  it("har en egen kodegruppe i H25-modus", () => {
    const pool = eksamensPool();
    const sp = lagEksamen({ ...STANDARD_OPPSETT, modus: "H25", sett: "C" }, new Set());
    const sisteGruppe = sp.filter((s) => s.gruppe === H25_GRUPPER.length - 1);
    for (const s of sisteGruppe) expect(pool.find((o) => o.id === s.id)?.tags).toContain("kode");
  });
  it("tar med omtrent hvert tiende spørsmål om kode i 2026-modus", () => {
    const pool = eksamensPool();
    for (const sett of ["A", "B", "C"] as const) {
      const sp = lagEksamen({ ...STANDARD_OPPSETT, sett }, new Set());
      const kode = sp.filter((s) => pool.find((o) => o.id === s.id)?.tags.includes("kode"));
      expect(kode.length).toBeGreaterThanOrEqual(4);
    }
  });
  it("skalerer antall spørsmål", () => {
    expect(lagEksamen({ ...STANDARD_OPPSETT, antall: 10 }, new Set())).toHaveLength(10);
    expect(lagEksamen({ ...STANDARD_OPPSETT, antall: 20 }, new Set())).toHaveLength(20);
  });
  it("prioriterer spørsmål som ikke er sett", () => {
    const pool = eksamensPool();
    // Annethvert spørsmål er sett, så hvert kapittel har nok usette til kvoten.
    const sett = new Set(pool.filter((_, i) => i % 2 === 0).map((o) => o.id));
    const sp = lagEksamen({ ...STANDARD_OPPSETT, antall: 40 }, sett);
    expect(sp.filter((s) => sett.has(s.id))).toHaveLength(0);
  });
  it("stokker alternativene uten å miste noen", () => {
    const sp = lagEksamen({ ...STANDARD_OPPSETT, antall: 10 }, new Set());
    const r = lagRekkefolge(sp, 7);
    for (const s of sp) expect([...r[s.id]].sort()).toEqual([0, 1, 2, 3]);
  });
});
