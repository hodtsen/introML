import type { TallDel } from "../types";

// Leser tall slik folk skriver dem: «0,25», «0.25», «1 234,5», «-3», «2/3», «1e-3», «25 %».
export function lesTall(tekst: string): number | null {
  let s = tekst.trim().replace(/−/g, "-").replace(/\s+/g, "");
  if (!s) return null;
  let prosent = false;
  if (s.endsWith("%")) {
    prosent = true;
    s = s.slice(0, -1);
  }
  s = s.replace(",", ".");
  let v: number;
  const brok = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (brok) v = Number(brok[1]) / Number(brok[2]);
  else if (/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) v = Number(s);
  else return null;
  if (!Number.isFinite(v)) return null;
  return prosent ? v / 100 : v;
}

export function erRiktigTall(svar: number, del: TallDel): boolean {
  const fasit = del.svar;
  const tol =
    del.toleranse !== null && del.toleranse !== undefined
      ? del.toleranse
      : Math.max(Math.abs(fasit) * (del.relativ ?? 0.02), 1e-9);
  return Math.abs(svar - fasit) <= tol + 1e-12;
}

export function formaterTall(v: number, desimaler = 4): string {
  const r = Number(v.toFixed(desimaler));
  return r.toLocaleString("nb-NO", { maximumFractionDigits: desimaler });
}
