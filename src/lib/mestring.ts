import { ALLE_DELKAPITLER, OPPGAVER } from "../data/innhold";
import type { Forsok, Tilstand } from "../store/fremgang";

// Score for én oppgave: vektet snitt av de tre siste forsøkene, nyeste teller mest.
const VEKTER = [1, 0.5, 0.25];
export function oppgaveScore(forsok: Forsok[] | undefined): number | null {
  if (!forsok || forsok.length === 0) return null;
  let sum = 0;
  let vekt = 0;
  forsok.slice(0, VEKTER.length).forEach((f, i) => {
    sum += f.score * VEKTER[i];
    vekt += VEKTER[i];
  });
  return sum / vekt;
}

export interface Mestring {
  forsokte: number;
  totalt: number;
  mestring: number | null; // snitt over forsøkte oppgaver
}

export function mestringFor(ider: string[], t: Tilstand): Mestring {
  let sum = 0;
  let forsokte = 0;
  for (const id of ider) {
    const s = oppgaveScore(t.forsok[id]);
    if (s !== null) {
      sum += s;
      forsokte++;
    }
  }
  return { forsokte, totalt: ider.length, mestring: forsokte ? sum / forsokte : null };
}

const iderPerDel = new Map<string, string[]>();
for (const o of OPPGAVER) {
  if (!iderPerDel.has(o.del)) iderPerDel.set(o.del, []);
  iderPerDel.get(o.del)!.push(o.id);
}

export function delMestring(del: string, t: Tilstand): Mestring {
  return mestringFor(iderPerDel.get(del) ?? [], t);
}

export function kapMestring(kap: number, t: Tilstand): Mestring {
  return mestringFor(
    OPPGAVER.filter((o) => o.kap === kap).map((o) => o.id),
    t
  );
}

export function samletMestring(t: Tilstand): Mestring {
  return mestringFor(
    OPPGAVER.map((o) => o.id),
    t
  );
}

// Delkapitler sortert etter behov for øving: lav mestring først, deretter lite dekning.
export function svakesteDeler(t: Tilstand, antall = 5) {
  return ALLE_DELKAPITLER.map((d) => ({ ...d, m: delMestring(d.nr, t) }))
    .filter((d) => d.m.mestring !== null)
    .sort((a, b) => (a.m.mestring ?? 0) - (b.m.mestring ?? 0))
    .slice(0, antall);
}

export function feiledeOppgaver(t: Tilstand): string[] {
  return OPPGAVER.filter((o) => {
    const f = t.forsok[o.id];
    return f && f.length > 0 && f[0].score < 0.999;
  }).map((o) => o.id);
}
