import { OPPGAVER } from "../data/innhold";
import type { Oppgave, OppgaveMeta } from "../types";
import { rng, stokk } from "./tilfeldig";

// Eksamenssimulering etter formatet på eksamen 2024/2025 og kunngjøringene for 2026:
// bare flervalgsspørsmål, regneoppgaver gitt som svaralternativer, negative poeng for feil.

export type Poengmodus = "2026" | "H25";
export type SettValg = "tilfeldig" | "A" | "B" | "C";

export interface EksamenOppsett {
  modus: Poengmodus;
  antall: number; // brukes i 2026-modus; H25 har alltid 10 grupper à 4
  varighetMin: number | null;
  inspera: boolean;
  sett: SettValg;
  prioriterUsette: boolean;
}

export const STANDARD_OPPSETT: EksamenOppsett = {
  modus: "2026",
  antall: 40,
  varighetMin: 240,
  inspera: true,
  sett: "tilfeldig",
  prioriterUsette: true,
};

export interface EksamenSporsmal {
  id: string;
  gruppe?: number;
}

export interface AktivEksamen {
  id: string;
  start: number;
  frist: number | null;
  oppsett: EksamenOppsett;
  sporsmal: EksamenSporsmal[];
  rekkefolge: Record<string, number[]>;
  svar: Record<string, number[]>;
  flagget: string[];
  gjeldende: number;
}

export interface Delresultat {
  poeng: number;
  maks: number;
  antall: number;
}

export interface EksamenResultat {
  id: string;
  start: number;
  slutt: number;
  oppsett: EksamenOppsett;
  sporsmal: EksamenSporsmal[];
  rekkefolge: Record<string, number[]>;
  svar: Record<string, number[]>;
  poeng: number;
  maks: number;
  prosent: number;
  karakter: string;
  perSporsmal: Record<string, { poeng: number; maks: number }>;
  perKap: Record<number, Delresultat>;
  perDel: Record<string, Delresultat>;
  perGruppe?: Record<number, Delresultat>;
  automatisk: boolean;
}

// Fordeling av 40 spørsmål over kapitlene, omtrent som på eksamen 2024 og 2025.
export const KVOTER: Record<number, number> = { 1: 6, 2: 5, 3: 5, 4: 4, 5: 5, 6: 6, 7: 4, 8: 3, 9: 2 };

// H25: ti temagrupper med fire spørsmål hver. Del 10 på H25 var Python-kode, så siste
// gruppe trekkes fra kodeoppgavene i hele pensum. AI Act og etikk (nytt etter H25) deler
// gruppe med forklarbar KI.
export const H25_GRUPPER: { navn: string; deler: (o: OppgaveMeta) => boolean }[] = [
  { navn: "Data og logistisk regresjon", deler: (o) => o.del.startsWith("1.") },
  { navn: "Bayes, ubalanse og beslutningstrær", deler: (o) => o.del.startsWith("2.") },
  { navn: "Ensembler", deler: (o) => o.del.startsWith("4.") },
  { navn: "Regresjon og validering", deler: (o) => o.del.startsWith("3.") },
  { navn: "Nevrale nettverk", deler: (o) => o.del.startsWith("5.") },
  { navn: "Klyngeanalyse", deler: (o) => ["6.1", "6.2", "6.3", "6.4"].includes(o.del) },
  { navn: "Dimensjonsreduksjon og anomalier", deler: (o) => ["6.5", "6.6", "6.7"].includes(o.del) },
  { navn: "Reinforcement learning", deler: (o) => o.del.startsWith("7.") },
  { navn: "Forklarbar KI og AI Act", deler: (o) => o.del.startsWith("8.") || o.del.startsWith("9.") },
  { navn: "Python og kode", deler: (o) => o.tags.includes("kode") },
];

const SETT_SEED: Record<Exclude<SettValg, "tilfeldig">, number> = { A: 4172, B: 8231, C: 1912 };

export function eksamensPool(): OppgaveMeta[] {
  return OPPGAVER.filter((o) => o.eksamen && (o.type === "enkeltvalg" || o.type === "flervalg"));
}

function skalerKvoter(antall: number): Record<number, number> {
  const totalt = Object.values(KVOTER).reduce((a, b) => a + b, 0);
  const rå = Object.entries(KVOTER).map(([k, v]) => ({ k: Number(k), v: (v * antall) / totalt }));
  const ut: Record<number, number> = {};
  let brukt = 0;
  for (const r of rå) {
    ut[r.k] = Math.floor(r.v);
    brukt += ut[r.k];
  }
  rå.sort((a, b) => (b.v % 1) - (a.v % 1));
  for (let i = 0; brukt < antall; i++, brukt++) ut[rå[i % rå.length].k]++;
  return ut;
}

// Trekker spørsmål spredt over delkapitlene i en kandidatliste. Med prioriterUsette
// trekkes først fra spørsmål brukeren ikke har sett, og resten fylles med sette.
function spredt(liste: OppgaveMeta[], n: number, r: () => number): OppgaveMeta[] {
  const perDel = new Map<string, OppgaveMeta[]>();
  for (const o of stokk(liste, r)) {
    if (!perDel.has(o.del)) perDel.set(o.del, []);
    perDel.get(o.del)!.push(o);
  }
  const deler = stokk([...perDel.keys()], r);
  const valgt: OppgaveMeta[] = [];
  while (valgt.length < n && deler.some((d) => perDel.get(d)!.length)) {
    for (const d of deler) {
      const o = perDel.get(d)!.shift();
      if (o) valgt.push(o);
      if (valgt.length >= n) break;
    }
  }
  return valgt;
}

function trekk(kandidater: OppgaveMeta[], n: number, r: () => number, sett: Set<string>, prioriterUsette: boolean, brukt: Set<string>) {
  const ledige = kandidater.filter((o) => !brukt.has(o.id));
  let valgt: OppgaveMeta[];
  if (prioriterUsette) {
    valgt = spredt(ledige.filter((o) => !sett.has(o.id)), n, r);
    if (valgt.length < n) valgt.push(...spredt(ledige.filter((o) => sett.has(o.id)), n - valgt.length, r));
  } else valgt = spredt(ledige, n, r);
  valgt.forEach((o) => brukt.add(o.id));
  return valgt;
}

export function lagEksamen(oppsett: EksamenOppsett, settOppgaver: Set<string>): EksamenSporsmal[] {
  const seed = oppsett.sett === "tilfeldig" ? Math.floor(Math.random() * 2 ** 31) : SETT_SEED[oppsett.sett];
  const r = rng(seed);
  const prior = oppsett.sett === "tilfeldig" && oppsett.prioriterUsette;
  const pool = eksamensPool();
  const brukt = new Set<string>();
  const sorter = (a: OppgaveMeta, b: OppgaveMeta) =>
    a.kap - b.kap || a.del.localeCompare(b.del, "nb", { numeric: true }) || a.id.localeCompare(b.id);

  if (oppsett.modus === "H25") {
    const ut: EksamenSporsmal[] = [];
    const enkelt = pool.filter((o) => o.type === "enkeltvalg");
    // Kodegruppen trekkes først, så de andre gruppene ikke bruker opp kodeoppgavene.
    const valgtPerGruppe = new Map<number, OppgaveMeta[]>();
    const rekkefolge = [H25_GRUPPER.length - 1, ...H25_GRUPPER.map((_, i) => i).slice(0, -1)];
    for (const gi of rekkefolge) {
      const g = H25_GRUPPER[gi];
      let valgt = trekk(enkelt.filter((o) => g.deler(o)), 4, r, settOppgaver, prior, brukt);
      if (valgt.length < 4) valgt = [...valgt, ...trekk(enkelt, 4 - valgt.length, r, settOppgaver, prior, brukt)];
      valgtPerGruppe.set(gi, valgt.sort(sorter));
    }
    H25_GRUPPER.forEach((_, gi) => valgtPerGruppe.get(gi)!.forEach((o) => ut.push({ id: o.id, gruppe: gi })));
    return ut;
  }

  const kvoter = skalerKvoter(oppsett.antall);
  // Omtrent hvert tiende spørsmål er en kodeoppgave, som i del 10 på H25. De teller med i
  // kvoten til kapitlet sitt.
  let valgt: OppgaveMeta[] = trekk(
    pool.filter((o) => o.tags.includes("kode")),
    Math.round(oppsett.antall / 10),
    r,
    settOppgaver,
    prior,
    brukt
  );
  for (const [kap, n] of Object.entries(kvoter)) {
    const rest = Math.max(0, n - valgt.filter((o) => o.kap === Number(kap)).length);
    valgt.push(...trekk(pool.filter((o) => o.kap === Number(kap)), rest, r, settOppgaver, prior, brukt));
  }
  if (valgt.length < oppsett.antall) valgt.push(...trekk(pool, oppsett.antall - valgt.length, r, settOppgaver, prior, brukt));
  valgt = valgt.slice(0, oppsett.antall).sort(sorter);
  return valgt.map((o) => ({ id: o.id }));
}

export function lagRekkefolge(sporsmal: EksamenSporsmal[], seed: number): Record<string, number[]> {
  const r = rng(seed);
  const ut: Record<string, number[]> = {};
  for (const s of sporsmal) {
    const meta = OPPGAVER.find((o) => o.id === s.id);
    const n = meta?.antallAlt ?? 0;
    ut[s.id] = stokk(
      Array.from({ length: n }, (_, i) => i),
      r
    );
  }
  return ut;
}

// ---------------------------------------------------------------- poeng

export function poengForSporsmal(o: Oppgave, valgt: number[], modus: Poengmodus): { poeng: number; maks: number } {
  const alt = o.alternativer ?? [];
  const k = alt.length;
  if (modus === "H25") {
    if (valgt.length === 0) return { poeng: 0, maks: 2.5 };
    return { poeng: alt[valgt[0]]?.riktig ? 2.5 : -2.5 / (k - 1), maks: 2.5 };
  }
  if (o.type === "flervalg") {
    const maks = alt.filter((a) => a.riktig).length;
    const poeng = valgt.reduce((s, i) => s + (alt[i]?.riktig ? 1 : -1), 0);
    return { poeng, maks };
  }
  if (valgt.length === 0) return { poeng: 0, maks: 1 };
  return { poeng: alt[valgt[0]]?.riktig ? 1 : -1 / (k - 1), maks: 1 };
}

// NTNUs anbefalte prosentskala. Eksamen 2024 brukte strengere grenser for A (92 %) og B (82 %).
export function karakter(prosent: number, strengere = false): string {
  const p = prosent * 100;
  if (p >= (strengere ? 92 : 89)) return "A";
  if (p >= (strengere ? 82 : 77)) return "B";
  if (p >= 65) return "C";
  if (p >= 53) return "D";
  if (p >= 41) return "E";
  return "F";
}

export function beregnResultat(e: AktivEksamen, oppgaver: Map<string, Oppgave>, automatisk: boolean): EksamenResultat {
  const modus = e.oppsett.modus;
  const perSporsmal: EksamenResultat["perSporsmal"] = {};
  const perKap: Record<number, Delresultat> = {};
  const perDel: Record<string, Delresultat> = {};
  const perGruppe: Record<number, Delresultat> = {};
  const leggTil = <K extends string | number>(m: Record<K, Delresultat>, k: K, p: number, maks: number) => {
    m[k] ??= { poeng: 0, maks: 0, antall: 0 };
    m[k].poeng += p;
    m[k].maks += maks;
    m[k].antall += 1;
  };
  for (const s of e.sporsmal) {
    const o = oppgaver.get(s.id);
    if (!o) continue;
    const r = poengForSporsmal(o, e.svar[s.id] ?? [], modus);
    perSporsmal[s.id] = r;
    leggTil(perKap, o.kap, r.poeng, r.maks);
    leggTil(perDel, o.del, r.poeng, r.maks);
    if (s.gruppe !== undefined) leggTil(perGruppe, s.gruppe, r.poeng, r.maks);
  }
  let poeng: number;
  let maks: number;
  if (modus === "H25") {
    // Null-grense per gruppe: en negativ gruppesum settes til 0.
    poeng = Object.values(perGruppe).reduce((s, g) => s + Math.max(0, g.poeng), 0);
    maks = Object.values(perGruppe).reduce((s, g) => s + g.maks, 0);
  } else {
    poeng = Object.values(perSporsmal).reduce((s, r) => s + r.poeng, 0);
    maks = Object.values(perSporsmal).reduce((s, r) => s + r.maks, 0);
  }
  const prosent = maks > 0 ? Math.max(0, poeng) / maks : 0;
  return {
    id: e.id,
    start: e.start,
    slutt: Date.now(),
    oppsett: e.oppsett,
    sporsmal: e.sporsmal,
    rekkefolge: e.rekkefolge,
    svar: e.svar,
    poeng,
    maks,
    prosent,
    karakter: karakter(prosent),
    perSporsmal,
    perKap,
    perDel,
    perGruppe: modus === "H25" ? perGruppe : undefined,
    automatisk,
  };
}

export function andel(d: { poeng: number; maks: number }) {
  return d.maks > 0 ? Math.max(0, d.poeng) / d.maks : 0;
}
