import type { Oppgave } from "../types";

// Poeng i øving (0–1). Eksamenspoeng regnes i eksamen.ts.

export function scoreValg(o: Oppgave, valgt: number[]): number {
  const alt = o.alternativer ?? [];
  if (o.type === "enkeltvalg") return valgt.length === 1 && alt[valgt[0]]?.riktig ? 1 : 0;
  const riktige = alt.filter((a) => a.riktig).length;
  const treff = valgt.filter((i) => alt[i]?.riktig).length;
  const feil = valgt.length - treff;
  return Math.max(0, treff - feil) / riktige;
}

// Hva svaret ville gitt på eksamen etter kunngjøringen for 2026.
export function eksamenspoeng2026(o: Oppgave, valgt: number[]): { poeng: number; maks: number } {
  const alt = o.alternativer ?? [];
  if (o.type === "flervalg") {
    return { poeng: valgt.reduce((s, i) => s + (alt[i]?.riktig ? 1 : -1), 0), maks: alt.filter((a) => a.riktig).length };
  }
  if (valgt.length === 0) return { poeng: 0, maks: 1 };
  return { poeng: alt[valgt[0]]?.riktig ? 1 : -1 / (alt.length - 1), maks: 1 };
}

export function formaterPoeng(p: number) {
  const r = Math.round(p * 100) / 100;
  const s = Math.abs(r).toLocaleString("nb-NO", { maximumFractionDigits: 2 });
  return r > 0 ? `+${s}` : r < 0 ? `−${s}` : "0";
}
