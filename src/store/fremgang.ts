import { useSyncExternalStore } from "react";
import type { EksamenOppsett, EksamenResultat, AktivEksamen } from "../lib/eksamen";

// All fremgang lagres i nettleserens localStorage under én nøkkel.
// Lagringen tåler at localStorage mangler (privat modus o.l.): da lever
// tilstanden bare til siden lukkes.

export interface Forsok {
  t: number; // tidspunkt (ms)
  score: number; // 0–1
  kilde: "oving" | "eksamen";
  svar?: unknown;
}

export interface Tilstand {
  versjon: 1;
  forsok: Record<string, Forsok[]>;
  fasitSett: Record<string, number>;
  lest: Record<string, number>;
  sistBesokt?: string;
  eksamener: EksamenResultat[];
  aktivEksamen?: AktivEksamen;
  sisteOppsett?: EksamenOppsett;
}

const NOKKEL = "tdt4172-eksamensportal-v1";
const MAKS_FORSOK = 10;

const tom = (): Tilstand => ({ versjon: 1, forsok: {}, fasitSett: {}, lest: {}, eksamener: [] });

function les(): Tilstand {
  try {
    const raw = localStorage.getItem(NOKKEL);
    if (!raw) return tom();
    const data = JSON.parse(raw);
    if (data?.versjon !== 1) return tom();
    return { ...tom(), ...data };
  } catch {
    return tom();
  }
}

let tilstand: Tilstand = les();
const lyttere = new Set<() => void>();

function lagre() {
  try {
    localStorage.setItem(NOKKEL, JSON.stringify(tilstand));
  } catch {
    /* lagring utilgjengelig: behold i minnet */
  }
}

function sett(endring: (t: Tilstand) => Tilstand) {
  tilstand = endring(tilstand);
  lagre();
  lyttere.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === NOKKEL) {
      tilstand = les();
      lyttere.forEach((l) => l());
    }
  });
}

export function hentTilstand() {
  return tilstand;
}

export function useFremgang(): Tilstand {
  return useSyncExternalStore(
    (l) => {
      lyttere.add(l);
      return () => lyttere.delete(l);
    },
    () => tilstand,
    () => tilstand
  );
}

export function registrerForsok(id: string, score: number, kilde: Forsok["kilde"], svar?: unknown) {
  sett((t) => {
    const liste = [{ t: Date.now(), score: Math.max(0, Math.min(1, score)), kilde, svar }, ...(t.forsok[id] ?? [])];
    return { ...t, forsok: { ...t.forsok, [id]: liste.slice(0, MAKS_FORSOK) } };
  });
}

export function registrerFasitSett(id: string) {
  sett((t) => ({ ...t, fasitSett: { ...t.fasitSett, [id]: Date.now() } }));
}

export function settLest(del: string, lest: boolean) {
  sett((t) => {
    const ny = { ...t.lest };
    if (lest) ny[del] = Date.now();
    else delete ny[del];
    return { ...t, lest: ny };
  });
}

export function settSistBesokt(del: string) {
  if (tilstand.sistBesokt === del) return;
  sett((t) => ({ ...t, sistBesokt: del }));
}

export function settAktivEksamen(e: AktivEksamen | undefined) {
  sett((t) => ({ ...t, aktivEksamen: e }));
}

export function oppdaterAktivEksamen(f: (e: AktivEksamen) => AktivEksamen) {
  sett((t) => (t.aktivEksamen ? { ...t, aktivEksamen: f(t.aktivEksamen) } : t));
}

export function lagreEksamenResultat(r: EksamenResultat, forsok: { id: string; score: number; svar: unknown }[]) {
  sett((t) => {
    const nyeForsok = { ...t.forsok };
    for (const f of forsok) {
      const liste = [{ t: r.slutt, score: Math.max(0, Math.min(1, f.score)), kilde: "eksamen" as const, svar: f.svar }, ...(nyeForsok[f.id] ?? [])];
      nyeForsok[f.id] = liste.slice(0, MAKS_FORSOK);
    }
    return { ...t, forsok: nyeForsok, eksamener: [r, ...t.eksamener].slice(0, 50), aktivEksamen: undefined };
  });
}

export function settSisteOppsett(o: EksamenOppsett) {
  sett((t) => ({ ...t, sisteOppsett: o }));
}

export function eksporter(): string {
  return JSON.stringify({ ...tilstand, eksportert: new Date().toISOString() }, null, 1);
}

export function importer(json: string): { ok: true } | { ok: false; melding: string } {
  try {
    const data = JSON.parse(json);
    if (data?.versjon !== 1 || typeof data.forsok !== "object") return { ok: false, melding: "Filen er ikke en eksport fra denne portalen." };
    sett(() => ({ ...tom(), ...data, aktivEksamen: undefined }));
    return { ok: true };
  } catch {
    return { ok: false, melding: "Filen kunne ikke leses som JSON." };
  }
}

export function nullstill() {
  sett(() => tom());
}
