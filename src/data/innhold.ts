import { useEffect, useState } from "react";
import pensumIndeks from "../generated/pensum-indeks.json";
import oppgaveIndeks from "../generated/oppgave-indeks.json";
import type { Begrep, Kapittel, KapittelMeta, KodeData, Oppgave, OppgaveMeta, SokPost } from "../types";

// Små indekser lastes med en gang; selve innholdet lastes per kapittel ved behov.
export const KAPITLER = pensumIndeks as KapittelMeta[];
export const OPPGAVER = oppgaveIndeks as OppgaveMeta[];

export const ALLE_DELKAPITLER = KAPITLER.flatMap((k) => k.delkapitler.map((d) => ({ ...d, kap: k.nr })));

export function finnDelkapittel(nr: string) {
  return ALLE_DELKAPITLER.find((d) => d.nr === nr);
}

export function nabo(nr: string, retning: -1 | 1) {
  const i = ALLE_DELKAPITLER.findIndex((d) => d.nr === nr);
  return ALLE_DELKAPITLER[i + retning];
}

export function oppgaverForDel(del: string) {
  return OPPGAVER.filter((o) => o.del === del);
}

const pensumLastere = import.meta.glob<{ default: Kapittel }>("../generated/pensum/kap*.json");
const oppgaveLastere = import.meta.glob<{ default: Oppgave[] }>("../generated/oppgaver/kap*.json");

const kapCache = new Map<number, Promise<Kapittel>>();
export function lastKapittel(nr: number): Promise<Kapittel> {
  if (!kapCache.has(nr)) {
    const laster = pensumLastere[`../generated/pensum/kap${nr}.json`];
    if (!laster) return Promise.reject(new Error(`Fant ikke kapittel ${nr}`));
    kapCache.set(nr, laster().then((m) => m.default));
  }
  return kapCache.get(nr)!;
}

const oppgCache = new Map<number, Promise<Oppgave[]>>();
export function lastOppgaverForKapittel(nr: number): Promise<Oppgave[]> {
  if (!oppgCache.has(nr)) {
    const laster = oppgaveLastere[`../generated/oppgaver/kap${nr}.json`];
    oppgCache.set(nr, laster ? laster().then((m) => m.default) : Promise.resolve([]));
  }
  return oppgCache.get(nr)!;
}

export async function lastOppgaver(ider: string[]): Promise<Map<string, Oppgave>> {
  const kaps = [...new Set(ider.map((id) => OPPGAVER.find((o) => o.id === id)?.kap).filter(Boolean) as number[])];
  const lister = await Promise.all(kaps.map(lastOppgaverForKapittel));
  const kart = new Map<string, Oppgave>();
  for (const l of lister) for (const o of l) kart.set(o.id, o);
  return kart;
}

let begrepPromise: Promise<Begrep[]> | null = null;
export function lastBegreper() {
  begrepPromise ??= import("../generated/begreper.json").then((m) => m.default as Begrep[]);
  return begrepPromise;
}

let sokPromise: Promise<SokPost[]> | null = null;
export function lastSok() {
  sokPromise ??= import("../generated/sok.json").then((m) => m.default as SokPost[]);
  return sokPromise;
}

// Enkel hook for asynkrone data. Returnerer undefined mens den laster.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; feil?: Error } {
  const [state, setState] = useState<{ data?: T; feil?: Error }>({});
  useEffect(() => {
    let aktiv = true;
    setState({});
    fn().then(
      (data) => aktiv && setState({ data }),
      (feil) => aktiv && setState({ feil })
    );
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

// Notatquizen ligger utenfor oppgavebanken (OPPGAVER), så den påvirker ikke eksamenspoolen eller mestringstallene.
export type NotatquizSett = "notater" | "eksempler" | "prosjekter";
const notatquizLastere: Record<NotatquizSett, () => Promise<{ default: unknown }>> = {
  notater: () => import("../generated/notatquiz/notater.json"),
  eksempler: () => import("../generated/notatquiz/eksempler.json"),
  prosjekter: () => import("../generated/notatquiz/prosjekter.json"),
};
const notatquizCache = new Map<NotatquizSett, Promise<Oppgave[]>>();
export function lastNotatquiz(sett: NotatquizSett): Promise<Oppgave[]> {
  if (!notatquizCache.has(sett)) notatquizCache.set(sett, notatquizLastere[sett]().then((m) => m.default as Oppgave[]));
  return notatquizCache.get(sett)!;
}

// Kodekortene i Kode-fanen lastes først når fanen åpnes.
let kodePromise: Promise<KodeData> | null = null;
export function lastKode() {
  kodePromise ??= import("../generated/kode.json").then((m) => m.default as KodeData);
  return kodePromise;
}
